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
        { status: 401 }
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
        { status: 400 }
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
      { status: 201 }
    );
  } catch (error) {
    console.error("Create business error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create business",
      },
      { status: 500 }
    );
  }
}