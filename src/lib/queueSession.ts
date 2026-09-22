import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Queue from "@/models/Queue";
import QueueSession from "@/models/QueueSession";

export function getDateKey(
  timezone: string,
  date: Date = new Date(),
) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

export async function getOrCreateQueueSession(queueId: string) {
  await connectDB();

  const queue = await Queue.findById(queueId);

  if (!queue) {
    return null;
  }

  const business = await Business.findById(queue.businessId);

  if (!business) {
    return null;
  }

  const timezone = business.timezone || "Asia/Kolkata";
  const dateKey = getDateKey(timezone);

  // Close any previous sessions that were left active or paused.
  await QueueSession.updateMany(
    {
      queueId,
      dateKey: { $lt: dateKey },
      status: { $in: ["active", "paused"] },
    },
    {
      $set: {
        status: "closed",
        closedAt: new Date(),
      },
    },
  );

  let session = await QueueSession.findOne({
    queueId,
    dateKey,
  });

  if (!session) {
    session = await QueueSession.create({
      queueId,
      dateKey,
      status: "closed",
      currentToken: 0,
    });
  }

  return session;
}

export async function getQueueSessionForDate(
  queueId: string,
  dateKey: string,
) {
  await connectDB();

  const queue = await Queue.findById(queueId);

  if (!queue) {
    return null;
  }

  const business = await Business.findById(queue.businessId);

  if (!business) {
    return null;
  }

  const session = await QueueSession.findOne({
    queueId,
    dateKey,
  });

  return session;
}