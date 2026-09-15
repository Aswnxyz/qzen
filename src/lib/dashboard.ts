import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Queue from "@/models/Queue";
import QueueEntry from "@/models/QueueEntry";
import { getOrCreateQueueSession } from "@/lib/queueSession";

export async function getBusinessDashboard(ownerId: string) {
  await connectDB();

  const business = await Business.findOne({ ownerId }).lean();

  if (!business) {
    return null;
  }

  const queues = await Queue.find({
    businessId: business._id,
  })
    .sort({ createdAt: 1 })
    .lean();

  const queueCards = await Promise.all(
    queues.map(async (queue) => {
      const session = await getOrCreateQueueSession(
        queue._id.toString(),
      );

      if (!session) {
        return null;
      }

      const waiting = await QueueEntry.countDocuments({
        queueId: queue._id,
        sessionId: session._id,
        status: "waiting",
      });

      const serving = await QueueEntry.findOne({
        queueId: queue._id,
        sessionId: session._id,
        status: "serving",
      }).lean();

      const servedToday = await QueueEntry.countDocuments({
        queueId: queue._id,
        sessionId: session._id,
        status: "completed",
      });

      return {
        queue,
        session,
        waiting,
        serving,
        servedToday,
      };
    }),
  );

  return {
  business,
  queues: queueCards.filter(
    (item): item is NonNullable<(typeof queueCards)[number]> =>
      item !== null,
  ),
};
}