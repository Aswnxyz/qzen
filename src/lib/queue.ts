import { connectDB } from "@/lib/db";
import Queue from "@/models/Queue";
import QueueEntry from "@/models/QueueEntry";
import { getOrCreateQueueSession } from "@/lib/queueSession";

export async function getQueueDashboard(queueId: string) {
  await connectDB();

  const queue = await Queue.findById(queueId).lean();

  if (!queue) {
    return null;
  }

  const queueSession = await getOrCreateQueueSession(queueId);

  if (!queueSession) {
    return null;
  }

  const waitingEntries = await QueueEntry.find({
    queueId,
    sessionId: queueSession._id,
    status: "waiting",
  })
    .sort({ tokenNumber: 1 })
    .lean();

  const servingEntry = await QueueEntry.findOne({
    queueId,
    sessionId: queueSession._id,
    status: "serving",
  }).lean();

  const servedToday = await QueueEntry.countDocuments({
    queueId,
    sessionId: queueSession._id,
    status: "completed",
  });

  return {
    queue,
      queueSession,
    waitingEntries,
    servingEntry,
    servedToday,
  };
}