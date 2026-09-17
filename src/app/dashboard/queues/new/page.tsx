import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import QueueCreateForm from "./QueueCreateForm";

export default async function QueueCreatePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  await connectDB();

  const business = await Business.findOne({
    ownerId: session.user.id,
  });

  if (!business) {
    redirect("/onboarding");
  }

  return <QueueCreateForm />;
}