import QueueEntry from "@/models/QueueEntry";
import { NextResponse } from "next/server";
import { getIO } from "@/lib/socket";
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
          message: "Failed to get today's queue session",
        },
        { status: 500 },
      );
    }

    const currentEntry = await QueueEntry.findOneAndUpdate(
      {
        queueId,
        sessionId: queueSession._id,

        status: "serving",
      },
      {
        status: "skipped",
        skippedAt: new Date(),
      },
      {
        new: true,
      },
    );

    if (!currentEntry) {
      return NextResponse.json(
        {
          success: false,
          message: "No customer is currently being served",
        },
        { status: 400 },
      );
    }

    const io = getIO();

    io?.to(`queue:${queueId}`).emit("queueUpdated", {
      currentToken: currentEntry.tokenNumber,
    });

    return NextResponse.json({
      success: true,
      message: `Token #${currentEntry.tokenNumber} skipped`,
      entry: currentEntry,
    });
  } catch (error) {
    console.error("Skip customer error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to skip customer",
      },
      { status: 500 },
    );
  }
}
