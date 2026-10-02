import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Queue from "@/models/Queue";
import QueueEntry from "@/models/QueueEntry";
import { getOrCreateQueueSession } from "@/lib/queueSession";
import { getVapidPublicKey } from "@/lib/notifications/push";
import {
  parseBrowserSubscription,
  pruneStaleSubscriptions,
  removeSubscription,
  upsertSubscription,
} from "@/lib/notifications/subscription";

/**
 * Customer push-subscription endpoint.
 *
 * Anonymous by design — Qzen lets customers join queues without accounts —
 * so the proof of identity is the same one the ticket/status pages already
 * use: the queueId + queueEntryId pair, with the server verifying the entry
 * really belongs to that queue (and to today's session) before anything is
 * stored. There is no way to send a push from this route; it only writes or
 * removes subscription records.
 */

/**
 * Resolves the queue entry a request may act on, applying every ownership
 * check first: valid ids, live queue, entry belonging to that queue.
 *
 * `requireLive` additionally pins the entry to today's session and rejects
 * terminal tickets — required before *storing* a subscription, but skipped
 * for removal so a customer can always turn notifications off, even after
 * their ticket finished or the day rolled over.
 */
async function resolveQueueEntry(
  queueId: unknown,
  queueEntryId: unknown,
  options: { requireLive: boolean },
) {
  if (
    typeof queueId !== "string" ||
    typeof queueEntryId !== "string" ||
    !mongoose.Types.ObjectId.isValid(queueId) ||
    !mongoose.Types.ObjectId.isValid(queueEntryId)
  ) {
    return { error: "Invalid queueId or queueEntryId." } as const;
  }

  const queue = await Queue.findOne({ _id: queueId, deletedAt: null });

  if (!queue) {
    return { error: "Queue not found" } as const;
  }

  const entry = await QueueEntry.findOne({ _id: queueEntryId, queueId });

  if (!entry) {
    return { error: "Customer ticket not found" } as const;
  }

  if (!options.requireLive) {
    return { queue, entry, queueSession: null } as const;
  }

  const queueSession = await getOrCreateQueueSession(queueId);

  if (!queueSession) {
    return { error: "Failed to get today's queue session" } as const;
  }

  if (entry.sessionId?.toString() !== queueSession._id.toString()) {
    return { error: "This ticket is no longer active." } as const;
  }

  if (entry.status === "completed" || entry.status === "skipped") {
    return { error: "This ticket is no longer active." } as const;
  }

  return { queue, entry, queueSession } as const;
}

/**
 * GET /api/notifications/subscribe
 *
 * Returns the public VAPID key the browser needs as `applicationServerKey`
 * when subscribing. The private key never leaves the server.
 */
export async function GET() {
  const publicKey = getVapidPublicKey();

  if (!publicKey) {
    return NextResponse.json(
      {
        success: false,
        message: "Push notifications are not configured.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ success: true, publicKey });
}

/**
 * POST /api/notifications/subscribe
 *
 * Stores a browser push subscription for the caller's queue entry after
 * verifying the entry belongs to the given queue and today's session.
 */
export async function POST(request: Request) {
  try {
    await connectDB();

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const { queueId, queueEntryId, subscription } = (body ?? {}) as Record<
      string,
      unknown
    >;

    const resolved = await resolveQueueEntry(queueId, queueEntryId, {
      requireLive: true,
    });

    if ("error" in resolved) {
      return NextResponse.json(
        { success: false, message: resolved.error },
        {
          status:
            resolved.error === "Queue not found" ||
            resolved.error === "Customer ticket not found"
              ? 404
              : 400,
        },
      );
    }

    const parsed = parseBrowserSubscription(subscription);

    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid push subscription payload.",
        },
        { status: 400 },
      );
    }

    if (!getVapidPublicKey()) {
      return NextResponse.json(
        {
          success: false,
          message: "Push notifications are not configured.",
        },
        { status: 503 },
      );
    }

    await upsertSubscription({
      queueEntryId: resolved.entry._id.toString(),
      queueId: resolved.queue._id.toString(),
      subscription: parsed,
    });

    // Housekeeping while we are here: sweep this queue's records whose
    // entry left the live set (old session, completed without cleanup).
    void pruneStaleSubscriptions({
      queueId: resolved.queue._id.toString(),
      sessionId: resolved.queueSession._id.toString(),
    }).catch((error) => {
      console.error("pruneStaleSubscriptions failed:", error);
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Subscribe error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save notification subscription",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/notifications/subscribe
 *
 * Removes the caller's own subscription (the endpoint they present, scoped
 * to their verified queue entry). Idempotent: removing an absent record
 * still reports success.
 */
export async function DELETE(request: Request) {
  try {
    await connectDB();

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const { queueId, queueEntryId, subscription } = (body ?? {}) as Record<
      string,
      unknown
    >;

    const endpoint =
      typeof subscription === "object" && subscription !== null
        ? (subscription as Record<string, unknown>).endpoint
        : undefined;

    if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) {
      return NextResponse.json(
        { success: false, message: "Invalid push subscription payload." },
        { status: 400 },
      );
    }

    // `requireLive: false` on purpose: unsubscribing stays possible after
    // the ticket finished or the day rolled over. Ownership of the entry is
    // still verified (it must belong to this queue).
    const resolved = await resolveQueueEntry(queueId, queueEntryId, {
      requireLive: false,
    });

    if ("error" in resolved) {
      return NextResponse.json(
        { success: false, message: resolved.error },
        { status: 400 },
      );
    }

    await removeSubscription({
      queueEntryId: resolved.entry._id.toString(),
      endpoint,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unsubscribe error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to remove notification subscription",
      },
      { status: 500 },
    );
  }
}
