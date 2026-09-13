import QueueEntry from "@/models/QueueEntry";
import { NextResponse } from "next/server";
import { getAuthorizedQueue } from "@/lib/authorization";
import { getOrCreateQueueSession } from "@/lib/queueSession";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      queueId: string;
    }>;
  },
) {
  try {
    const { queueId } = await params;

    const { session, queue } = await getAuthorizedQueue(queueId);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    if (!queue) {
      return NextResponse.json(
        {
          success: false,
          message: "Queue not found",
        },
        { status: 404 },
      );
    }

    const queueSession = await getOrCreateQueueSession(queueId);

    if (!queueSession) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to get queue session",
        },
        { status: 500 },
      );
    }

    const result = await QueueEntry.updateMany(
      {
        queueId,
        sessionId: { $exists: false },
      },
      {
        $set: {
          sessionId: queueSession._id,
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: "Existing queue entries migrated to today's session.",
      sessionId: queueSession._id,
      dateKey: queueSession.dateKey,
      migratedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Session migration error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to migrate queue entries",
      },
      { status: 500 },
    );
  }
}