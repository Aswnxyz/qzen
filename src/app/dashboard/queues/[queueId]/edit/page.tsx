import mongoose from "mongoose";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Queue from "@/models/Queue";
import QueueEditForm from "./QueueEditForm";

interface QueueEditPageProps {
  params: Promise<{
    queueId: string;
  }>;
}

export default async function QueueEditPage({ params }: QueueEditPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { queueId } = await params;

  await connectDB();

  const business = await Business.findOne({
    ownerId: session.user.id,
  }).lean();

  if (!business) {
    redirect("/onboarding");
  }

  const queue = mongoose.Types.ObjectId.isValid(queueId)
    ? await Queue.findOne({
        _id: queueId,
        businessId: business._id,
        deletedAt: null,
      }).lean()
    : null;

  if (!queue) {
    return <p>Queue not found.</p>;
  }

  return (
    <QueueEditForm
      queueId={queueId}
      initialName={queue.name}
      initialSlug={queue.slug}
    />
  );
}
