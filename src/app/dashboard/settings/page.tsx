import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
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

  const timezones = [
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

  return (
    <section className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
          Settings
        </h1>

        <p className="mt-2 text-sm text-qz-text-2">
          Manage your business and account settings.
        </p>
      </header>

      <div className="mt-8 space-y-6">
        <SettingsForm
          businessName={business.name}
          businessSlug={business.slug}
          timezone={business.timezone || "Asia/Kolkata"}
          timezones={timezones}
          email={session.user.email}
        />
      </div>
    </section>
  );
}