import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Queue from "@/models/Queue";

/**
 * Loads the business owned by `ownerId`.
 *
 * This is the single ownership anchor for Qzen: every queue is scoped through
 * the business it belongs to, and a business is scoped through its owner.
 */
export async function getBusinessByOwner(ownerId: string) {
  await connectDB();

  return Business.findOne({
    ownerId,
  });
}

/**
 * Loads `queueId` only when it belongs to the business owned by `ownerId`.
 *
 * Callers must never query a queue by id alone — ownership is always verified
 * here so a leaked or guessed queue id cannot cross business boundaries.
 */
export async function getQueueForOwner(ownerId: string, queueId: string) {
  await connectDB();

  const business = await Business.findOne({
    ownerId,
  });

  if (!business) {
    return {
      business: null,
      queue: null,
    };
  }

  const queue = await Queue.findOne({
    _id: queueId,
    businessId: business._id,
  });

  return {
    business,
    queue,
  };
}

export async function getAuthorizedQueue(queueId: string) {
  const session = await getSession();

  if (!session) {
    return {
      session: null,
      business: null,
      queue: null,
    };
  }

  const { business, queue } = await getQueueForOwner(session.user.id, queueId);

  return {
    session,
    business,
    queue,
  };
}
