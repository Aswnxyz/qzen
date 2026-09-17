import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const db = client.db("qzen");

    const existingUser = await db.collection("user").findOne(
      { email },
      {
        projection: {
          _id: 1,
        },
      }
    );

    return NextResponse.json({
      exists: Boolean(existingUser),
    });
  } catch (error) {
    console.error("Check email error:", error);

    return NextResponse.json(
      { error: "Unable to check email." },
      { status: 500 }
    );
  }
}