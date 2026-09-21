import { redirect } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Business from "@/models/Business";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  await connectDB();

  const business = await Business.findOne({
    ownerId: session.user.id,
  }).lean();

  if (!business) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-zinc-50 lg:flex lg:h-screen lg:overflow-hidden">
      <DashboardSidebar businessName={business.name} />

      <div className="flex min-w-0 flex-1 flex-col lg:min-h-0">
        <DashboardHeader businessName={business.name} />

        <main className="flex-1 lg:min-h-0 lg:overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}