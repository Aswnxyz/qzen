import QueueEntry from "@/models/QueueEntry";
import { getIO } from "@/lib/socket";
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
          message: "Failed to get today's queue session",
        },
        { status: 500 },
      );
    }

    if (queueSession.status === "closed") {
      return NextResponse.json(
        {
          success: false,
          message: "This queue is closed",
        },
        { status: 400 },
      );
    }

    const currentEntry = await QueueEntry.findOne({
      queueId,
      sessionId: queueSession._id,
      status: "serving",
    });

    if (currentEntry) {
      return NextResponse.json(
        {
          success: false,
          message: "A customer is already being served",
        },
        { status: 400 },
      );
    }

    const nextEntry = await QueueEntry.findOneAndUpdate(
      {
        queueId,
        sessionId: queueSession._id,
        status: "waiting",
      },
      {
        status: "serving",
        calledAt: new Date(),
      },
      {
        sort: { tokenNumber: 1 },
        new: true,
      },
    );

    if (!nextEntry) {
      return NextResponse.json(
        {
          success: false,
          message: "No customers waiting",
        },
        { status: 400 },
      );
    }

    queueSession.currentToken = nextEntry.tokenNumber;
    await queueSession.save();

    const io = getIO();

    io?.to(`queue:${queueId}`).emit("queueUpdated", {
      currentToken: queueSession.currentToken,
    });

    return NextResponse.json({
      success: true,
      message: `Token #${nextEntry.tokenNumber} is now being served`,
      entry: nextEntry,
    });
  } catch (error) {
    console.error("Call next error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to call next customer",
      },
      { status: 500 },
    );
  }
}
