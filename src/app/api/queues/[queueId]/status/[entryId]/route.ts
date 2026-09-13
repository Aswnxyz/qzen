import { connectDB } from "@/lib/db";
import Queue from "@/models/Queue";
import QueueEntry from "@/models/QueueEntry";
import { getOrCreateQueueSession } from "@/lib/queueSession";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      queueId: string;
      entryId: string;
    }>;
  },
) {
  try {
    await connectDB();

    const { queueId, entryId } = await params;

    const queue = await Queue.findById(queueId);

    if (!queue) {
      return NextResponse.json(
        {
          success: false,
          message: "Queue not found",
        },
        { status: 404 },
      );
    }

    const customer = await QueueEntry.findOne({
      _id: entryId,
      queueId,
    });

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer ticket not found",
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

    const isCurrentSession =
      customer.sessionId?.toString() === queueSession._id.toString();

    if (!isCurrentSession) {
      return NextResponse.json({
        success: true,
        isCurrentSession: false,
      });
    }

    const currentToken = queueSession.currentToken;

    const peopleAhead = await QueueEntry.countDocuments({
      queueId,
      sessionId: queueSession._id,
      tokenNumber: {
        $gt: currentToken,
        $lt: customer.tokenNumber,
      },
      status: "waiting",
    });

    const estimatedWait = peopleAhead * queue.averageServiceTime;

    return NextResponse.json({
      success: true,
      isCurrentSession: true,
      status: customer.status,
      queueStatus: queueSession.status,
      tokenNumber: customer.tokenNumber,
      currentToken,
      peopleAhead,
      estimatedWait,
    });
  } catch (error) {
    console.error("Queue status error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to get queue status",
      },
      { status: 500 },
    );
  }
}
