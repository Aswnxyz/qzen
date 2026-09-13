import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Queue from "@/models/Queue";

export async function getAuthorizedQueue(queueId: string) {
  const session = await getSession();

  if (!session) {
    return {
      session: null,
      business: null,
      queue: null,
    };
  }

  await connectDB();

  const business = await Business.findOne({
    ownerId: session.user.id,
  });

  if (!business) {
    return {
      session,
      business: null,
      queue: null,
    };
  }

  const queue = await Queue.findOne({
    _id: queueId,
    businessId: business._id,
  });

  return {
    session,
    business,
    queue,
  };
}