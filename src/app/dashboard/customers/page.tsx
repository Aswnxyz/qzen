import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Queue from "@/models/Queue";
import QueueEntry from "@/models/QueueEntry";
import DateFilter from "@/components/dashboard/DateFilter";
import {
  getDateKey,
  getOrCreateQueueSession,
  getQueueSessionForDate,
} from "@/lib/queueSession";
import CustomersTable from "./CustomersTable";

interface CustomersPageProps {
  searchParams: Promise<{
    date?: string;
  }>;
}

function formatDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-");

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
  }).format(new Date(Number(year), Number(month) - 1, Number(day)));
}

function isValidDateKey(dateKey: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey);
}

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { date } = await searchParams;

  await connectDB();

  const business = await Business.findOne({
    ownerId: session.user.id,
  }).lean();

  if (!business) {
    redirect("/onboarding");
  }

  const timezone = business.timezone || "Asia/Kolkata";
  const todayDateKey = getDateKey(timezone);
  const yesterdayDate = new Date(`${todayDateKey}T12:00:00`);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  const yesterdayDateKey = getDateKey(timezone, yesterdayDate);

  const selectedDate = date && isValidDateKey(date) ? date : todayDateKey;

  if (selectedDate > todayDateKey) {
    redirect(`/dashboard/customers?date=${todayDateKey}`);
  }

  const queues = await Queue.find({
    businessId: business._id,
  })
    .select("_id name")
    .sort({ createdAt: 1 })
    .lean();

  const queueCustomers = await Promise.all(
    queues.map(async (queue) => {
      const queueSession =
        selectedDate === todayDateKey
          ? await getOrCreateQueueSession(queue._id.toString())
          : await getQueueSessionForDate(queue._id.toString(), selectedDate);

      if (!queueSession) {
        return [];
      }

      const entries = await QueueEntry.find({
        queueId: queue._id,
        sessionId: queueSession._id,
      })
        .sort({ joinedAt: -1 })
        .lean();

      return entries.map((entry) => ({
        id: entry._id.toString(),
        customerName: entry.customerName,
        tokenNumber: entry.tokenNumber,
        queueName: queue.name,
        status: entry.status,
        joinedAt: entry.joinedAt.toISOString(),
        completedAt: entry.completedAt ? entry.completedAt.toISOString() : null,
      }));
    }),
  );

  const customers = queueCustomers.flat();

  const isToday = selectedDate === todayDateKey;
  const formattedDate = formatDate(selectedDate);

  return (
    <section className="p-6 sm:p-8 lg:p-10">
      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              Customers
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              View and manage customers across your queues.
            </p>
          </div>

          <DateFilter
            selectedDate={selectedDate}
            todayDateKey={todayDateKey}
            basePath="/dashboard/customers"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <a
            href="/dashboard/customers"
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              isToday
                ? "bg-zinc-950 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Today
          </a>

          <a
            href={`/dashboard/customers?date=${yesterdayDateKey}`}
            className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-200"
          >
            Yesterday
          </a>

          <span className="text-xs text-zinc-400">Showing {formattedDate}</span>
        </div>

        <p className="mt-4 text-xs font-medium text-zinc-500">
          {customers.length} {customers.length === 1 ? "customer" : "customers"}{" "}
          {isToday ? "today" : `on ${formattedDate}`}
        </p>
      </header>

      <div className="mt-8">
        <CustomersTable
          customers={customers}
          selectedDate={selectedDate}
          isToday={isToday}
        />
      </div>
    </section>
  );
}
