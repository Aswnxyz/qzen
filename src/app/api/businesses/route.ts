import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

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

    const business = await Business.create({
      name: body.name,
      ownerId: session.user.id,
      slug: body.slug,
    });

    return NextResponse.json(
      {
        success: true,
        business,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create business error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create business",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
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

    const name = body?.name?.trim();
    const timezone = body?.timezone?.trim();

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Business name is required.",
        },
        { status: 400 },
      );
    }

    if (!timezone) {
      return NextResponse.json(
        {
          success: false,
          message: "Timezone is required.",
        },
        { status: 400 },
      );
    }

    const supportedTimezones = [
      "Asia/Kolkata",
      "Asia/Dubai",
      "Asia/Singapore",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Europe/London",
      "Europe/Berlin",
      "Europe/Paris",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "Australia/Sydney",
      "Pacific/Auckland",
      "UTC",
    ];

    if (!supportedTimezones.includes(timezone)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid timezone.",
        },
        { status: 400 },
      );
    }

    const business = await Business.findOneAndUpdate(
      {
        ownerId: session.user.id,
      },
      {
        $set: {
          name,
          timezone,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    ).lean();

    if (!business) {
      return NextResponse.json(
        {
          success: false,
          message: "Business not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      business,
    });
  } catch (error) {
    console.error("Update business error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update business.",
      },
      { status: 500 },
    );
  }
}
