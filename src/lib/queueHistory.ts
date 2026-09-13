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

export async function getQueueHistory(queueId: string) {
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

  const sessions = await QueueSession.find({
    queueId,
    dateKey: { $lt: todayDateKey },
  })
    .sort({ dateKey: -1 })
    .lean();

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
                ],
              },
              {
                $subtract: ["$completedAt", "$calledAt"],
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
