import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Queue from "@/models/Queue";
import QueueEntry from "@/models/QueueEntry";
import QueueSession from "@/models/QueueSession";

function getDateKey(timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

/**
 * Per-day summaries for every past session of a queue, newest first.
 *
 * `options.limit` caps how many past days are returned (used by the MCP
 * `get_queue_history` tool). Omitting it preserves the unbounded behaviour the
 * dashboard has always had.
 *
 * `averageServiceTimeMs` is `completedAt - calledAt` and
 * `averageWaitTimeMs` is `calledAt - joinedAt`, both averaged only over the
 * entries that carry both timestamps and whose timestamps run forwards, so
 * dirty data can never pull an average below zero. This is the same rule the
 * analytics dashboard applies inline. The queue detail page only renders the
 * counts from this function, never these averages.
 */
export async function getQueueHistory(
  queueId: string,
  options: { limit?: number } = {},
) {
  await connectDB();

  const queue = await Queue.findById(queueId).lean();

  if (!queue) {
    return null;
  }

  const business = await Business.findById(queue.businessId).lean();

  if (!business) {
    return null;
  }

  const timezone = business.timezone || "Asia/Kolkata";
  const todayDateKey = getDateKey(timezone);

  const sessionsQuery = QueueSession.find({
    queueId,
    dateKey: { $lt: todayDateKey },
  }).sort({ dateKey: -1 });

  if (options.limit !== undefined) {
    sessionsQuery.limit(options.limit);
  }

  const sessions = await sessionsQuery.lean();

  const sessionIds = sessions.map((session) => session._id);

  const summaries = await QueueEntry.aggregate([
    {
      $match: {
        queueId: queue._id,
        sessionId: { $in: sessionIds },
      },
    },
    {
      $group: {
        _id: "$sessionId",

        totalCustomers: {
          $sum: 1,
        },

        completed: {
          $sum: {
            $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
          },
        },

        skipped: {
          $sum: {
            $cond: [{ $eq: ["$status", "skipped"] }, 1, 0],
          },
        },

        waiting: {
          $sum: {
            $cond: [{ $eq: ["$status", "waiting"] }, 1, 0],
          },
        },

        serving: {
          $sum: {
            $cond: [{ $eq: ["$status", "serving"] }, 1, 0],
          },
        },

        averageServiceTimeMs: {
          $avg: {
            $cond: [
              {
                $and: [
                  { $ne: ["$calledAt", null] },
                  { $ne: ["$completedAt", null] },
                  { $gte: ["$completedAt", "$calledAt"] },
                ],
              },
              {
                $subtract: ["$completedAt", "$calledAt"],
              },
              null,
            ],
          },
        },

        averageWaitTimeMs: {
          $avg: {
            $cond: [
              {
                $and: [
                  { $ne: ["$calledAt", null] },
                  { $ne: ["$joinedAt", null] },
                  { $gte: ["$calledAt", "$joinedAt"] },
                ],
              },
              {
                $subtract: ["$calledAt", "$joinedAt"],
              },
              null,
            ],
          },
        },
      },
    },
  ]);

  const summaryMap = new Map(
    summaries.map((summary) => [summary._id.toString(), summary]),
  );

  return sessions.map((session) => {
    const summary = summaryMap.get(session._id.toString());

    return {
      session,
      summary: {
        totalCustomers: summary?.totalCustomers ?? 0,
        completed: summary?.completed ?? 0,
        skipped: summary?.skipped ?? 0,
        waiting: summary?.waiting ?? 0,
        serving: summary?.serving ?? 0,
        averageServiceTimeMs: summary?.averageServiceTimeMs ?? null,
        averageWaitTimeMs: summary?.averageWaitTimeMs ?? null,
      },
    };
  });
}

export async function getQueueHistorySession(queueId: string, dateKey: string) {
  await connectDB();

  const queue = await Queue.findById(queueId).lean();

  if (!queue) {
    return null;
  }

  const session = await QueueSession.findOne({
    queueId,
    dateKey,
  }).lean();

  if (!session) {
    return null;
  }

  const entries = await QueueEntry.find({
    queueId,
    sessionId: session._id,
  })
    .sort({ tokenNumber: 1 })
    .lean();

  const totalCustomers = entries.length;

  const completed = entries.filter(
    (entry) => entry.status === "completed",
  ).length;

  const skipped = entries.filter((entry) => entry.status === "skipped").length;

  const waiting = entries.filter((entry) => entry.status === "waiting").length;

  const serving = entries.filter((entry) => entry.status === "serving").length;

  const serviceTimes = entries
    .filter((entry) => entry.calledAt && entry.completedAt)
    .map((entry) => entry.completedAt!.getTime() - entry.calledAt!.getTime());

  const averageServiceTimeMs =
    serviceTimes.length > 0
      ? serviceTimes.reduce((total, time) => total + time, 0) /
        serviceTimes.length
      : null;

  return {
    session,
    entries,
    summary: {
      totalCustomers,
      completed,
      skipped,
      waiting,
      serving,
      averageServiceTimeMs,
    },
  };
}
