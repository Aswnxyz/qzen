import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Queue from "@/models/Queue";
import QueueEntry from "@/models/QueueEntry";
import { getOrCreateQueueSession } from "@/lib/queueSession";

function getHourLabel(hour: number) {
  const suffix = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 || 12;

  return `${displayHour} ${suffix}`;
}

function getHourKey(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";

  return Number(hour);
}

export async function getBusinessDashboard(ownerId: string) {
  await connectDB();

  const business = await Business.findOne({ ownerId }).lean();

  if (!business) {
    return null;
  }

  const timezone = business.timezone || "Asia/Kolkata";

  const queues = await Queue.find({
    businessId: business._id,
  })
    .sort({ createdAt: 1 })
    .lean();

  const queueCards = await Promise.all(
    queues.map(async (queue) => {
      const session = await getOrCreateQueueSession(queue._id.toString());

      if (!session) {
        return null;
      }

      const entries = await QueueEntry.find({
        queueId: queue._id,
        sessionId: session._id,
      })
        .sort({ joinedAt: -1 })
        .lean();

      const waiting = entries.filter(
        (entry) => entry.status === "waiting",
      ).length;

      const serving =
        entries.find((entry) => entry.status === "serving") ?? null;

      const servedToday = entries.filter(
        (entry) => entry.status === "completed",
      ).length;

      const noShows = entries.filter(
        (entry) => entry.status === "skipped",
      ).length;

      return {
        queue,
        session,
        entries,
        waiting,
        serving,
        servedToday,
        noShows,
      };
    }),
  );

  const validQueueCards = queueCards.filter(
    (item): item is NonNullable<(typeof queueCards)[number]> => item !== null,
  );

  const allEntries = validQueueCards.flatMap((item) => item.entries);

  const activityByHour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: getHourLabel(hour),
    joined: 0,
    served: 0,
  }));

  for (const entry of allEntries) {
    if (entry.joinedAt) {
      const hour = getHourKey(new Date(entry.joinedAt), timezone);

      activityByHour[hour].joined += 1;
    }

    if (entry.completedAt) {
      const hour = getHourKey(new Date(entry.completedAt), timezone);

      activityByHour[hour].served += 1;
    }
  }

  const recentActivity = allEntries
    .flatMap((entry) => {
      const queue = validQueueCards.find(
        (item) => item.queue._id.toString() === entry.queueId.toString(),
      );

      const events = [];

      if (entry.joinedAt) {
        events.push({
          type: "joined" as const,
          queueName: queue?.queue.name ?? "Queue",
          tokenNumber: entry.tokenNumber,
          customerName: entry.customerName,
          timestamp: new Date(entry.joinedAt),
        });
      }

      if (entry.calledAt) {
        events.push({
          type: "called" as const,
          queueName: queue?.queue.name ?? "Queue",
          tokenNumber: entry.tokenNumber,
          customerName: entry.customerName,
          timestamp: new Date(entry.calledAt),
        });
      }

      if (entry.completedAt) {
        events.push({
          type: "completed" as const,
          queueName: queue?.queue.name ?? "Queue",
          tokenNumber: entry.tokenNumber,
          customerName: entry.customerName,
          timestamp: new Date(entry.completedAt),
        });
      }

      if (entry.skippedAt) {
        events.push({
          type: "skipped" as const,
          queueName: queue?.queue.name ?? "Queue",
          tokenNumber: entry.tokenNumber,
          customerName: entry.customerName,
          timestamp: new Date(entry.skippedAt),
        });
      }

      return events;
    })
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);

  const activeQueues = validQueueCards
    .filter((item) => item.session.status === "active")
    .map((item) => ({
      queue: item.queue,
      session: item.session,
      waiting: item.waiting,
      serving: item.serving,
      servedToday: item.servedToday,
    }));

  return {
    business,

    queues: validQueueCards.map((queueCard) => {
      const { entries, noShows, ...data } = queueCard;

      void entries;
      void noShows;

      return data;
    }),

    stats: {
      totalCustomers: allEntries.length,

      currentlyWaiting: allEntries.filter((entry) => entry.status === "waiting")
        .length,

      servedToday: allEntries.filter((entry) => entry.status === "completed")
        .length,

      noShows: allEntries.filter((entry) => entry.status === "skipped").length,
    },

    activity: activityByHour,

    activeQueues,

    recentActivity,
  };
}
