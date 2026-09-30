import { NextResponse } from "next/server";
import { getAuthorizedQueue } from "@/lib/authorization";
import {
  QueueOperationError,
  skipCurrentCustomer,
} from "@/lib/queueMutations";

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

    const { entry, message } = await skipCurrentCustomer(
      session.user.id,
      queueId,
    );

    return NextResponse.json({
      success: true,
      message,
      entry,
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
