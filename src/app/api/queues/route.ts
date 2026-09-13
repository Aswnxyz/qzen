import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Business from "@/models/Business";
import Queue from "@/models/Queue";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    await connectDB();

    const business = await Business.findOne({
      ownerId: session.user.id,
    });

    if (!business) {
      return NextResponse.json(
        {
          success: false,
          message: "Business not found",
        },
        { status: 404 },
      );
    }

    const queues = await Queue.find({
      businessId: business._id,
    })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      queues,
    });
  } catch (error) {
    console.error("Get queues error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to get queues",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    await connectDB();

    const body = await request.json();

    if (!body.name || !body.slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Name and slug are required",
        },
        { status: 400 },
      );
    }

    const business = await Business.findOne({
      ownerId: session.user.id,
    });

    if (!business) {
      return NextResponse.json(
        {
          success: false,
          message: "Business not found",
        },
        { status: 404 },
      );
    }

    const queue = await Queue.create({
      businessId: business._id,
      name: body.name,
      slug: body.slug,
    });

    return NextResponse.json(
      {
        success: true,
        queue,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create queue error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create queue",
      },
      { status: 500 },
    );
  }
}
