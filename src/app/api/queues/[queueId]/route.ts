import { NextResponse } from "next/server";
import { getAuthorizedQueue } from "@/lib/authorization";
import {
  QueueOperationError,
  deleteQueueForOwner,
  updateQueueForOwner,
} from "@/lib/queueMutations";

export async function PATCH(
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

    const body = await request.json();

    const { queue: updatedQueue } = await updateQueueForOwner(
      session.user.id,
      queueId,
      body,
    );

    return NextResponse.json({
      success: true,
      queue: updatedQueue,
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

    console.error("Update queue error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update queue",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
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

    await deleteQueueForOwner(session.user.id, queueId);

    return NextResponse.json({
      success: true,
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

    console.error("Delete queue error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete queue",
      },
      { status: 500 },
    );
  }
}
