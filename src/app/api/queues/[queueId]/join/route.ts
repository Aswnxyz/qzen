import { connectDB } from "@/lib/db";
import Queue from "@/models/Queue";
import QueueEntry from "@/models/QueueEntry";
import { NextResponse } from "next/server";
import { getIO } from "@/lib/socket";
import { getOrCreateQueueSession } from "@/lib/queueSession";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ queueId: string }> },
) {
  try {
    await connectDB();

    const { queueId } = await params;

    const body = await request.json();

    if (!body.customerName) {
      return NextResponse.json(
        {
          success: false,
          message: "customerName is required",
        },
        { status: 400 },
      );
    }

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

    const queueSession = await getOrCreateQueueSession(queueId);

    if (!queueSession) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to get today's queue session.",
        },
        { status: 500 },
      );
    }
    if (queueSession.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message:
            queueSession.status === "paused"
              ? "This queue is temporarily paused."
              : "This queue is currently closed.",
        },
        { status: 400 },
      );
    }



    const latestEntry = await QueueEntry.findOne({
      queueId,
      sessionId: queueSession._id,
    }).sort({
      tokenNumber: -1,
    });

    const nextToken = latestEntry ? latestEntry.tokenNumber + 1 : 1;

    const entry = await QueueEntry.create({
      queueId,
      sessionId: queueSession._id,
      tokenNumber: nextToken,
      customerName: body.customerName,
    });

    const io = getIO();

    io?.to(`queue:${queueId}`).emit("queueUpdated", {
      currentToken: queueSession.currentToken,
    });

    return NextResponse.json(
      {
        success: true,
        entry,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Join queue error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to join queue",
      },
      { status: 500 },
    );
  }
}
