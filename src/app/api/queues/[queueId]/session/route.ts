import { NextResponse } from "next/server";
import { getAuthorizedQueue } from "@/lib/authorization";
import { getOrCreateQueueSession } from "@/lib/queueSession";

export async function GET(
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
          message: "Failed to create queue session",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      session: queueSession,
    });
  } catch (error) {
    console.error("Queue session error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to get queue session",
      },
      { status: 500 },
    );
  }
}