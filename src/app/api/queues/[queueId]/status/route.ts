import { getAuthorizedQueue } from "@/lib/authorization";
import { NextResponse } from "next/server";
import { QueueOperationError, setQueueStatus } from "@/lib/queueMutations";

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

    const body = await request.json();

    const { queueSession } = await setQueueStatus(
      session.user.id,
      queueId,
      body.status,
    );

    return NextResponse.json({
      success: true,
      session: queueSession,
    });
  } catch (error) {
    if (error instanceof QueueOperationError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: error.statusCode },
      );
    }

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
