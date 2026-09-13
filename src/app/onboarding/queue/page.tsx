import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import QueueSetupForm from "./QueueSetupForm";

export default async function QueueSetupPage() {
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

  return <QueueSetupForm />;
}