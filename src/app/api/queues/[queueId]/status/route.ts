import { getAuthorizedQueue } from "@/lib/authorization";
import { getIO } from "@/lib/socket";
import { getOrCreateQueueSession } from "@/lib/queueSession";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ queueId: string }> },
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

    const body = await request.json();

    const allowedStatuses = ["active", "paused", "closed"];

    if (!allowedStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid queue status",
        },
        { status: 400 },
      );
    }

    queueSession.status = body.status;

    if (body.status === "closed") {
      queueSession.closedAt = new Date();
    } else {
      queueSession.closedAt = undefined;
    }

    await queueSession.save();

    const io = getIO();

    io?.to(`queue:${queueId}`).emit("queueUpdated", {
      status: queueSession.status,
      currentToken: queueSession.currentToken,
    });

    return NextResponse.json({
      success: true,
      session: queueSession,
    });
  } catch (error) {
    console.error("Update queue status error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update queue status",
      },
      { status: 500 },
    );
  }
}