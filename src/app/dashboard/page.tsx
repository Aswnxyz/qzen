import Link from "next/link";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import { getSession } from "@/lib/auth";
import { getBusinessDashboard } from "@/lib/dashboard";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const data = await getBusinessDashboard(session.user.id);

  if (!data) {
    return <p>Business not found.</p>;
  }

  const { business, queues } = data;

  return (
    <main className="flex min-h-screen bg-zinc-50">
      <DashboardSidebar />

      <section className="flex-1 p-8">
        <header className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm text-zinc-500">Business Dashboard</p>

            <h1 className="mt-1 text-3xl font-bold text-zinc-900">
              {business.name}
            </h1>

            <p className="mt-2 text-zinc-600">
              Manage your queues and monitor Today&apos;s activity.
            </p>
          </div>

          <Link
            href="/dashboard/queues"
            className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Manage Queues
          </Link>
        </header>

        <div className="mt-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">
                Your Queues
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Today&apos;s queue activity at a glance.
              </p>
            </div>

            <Link
              href="/dashboard/queues"
              className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              View all →
            </Link>
          </div>

          {queues.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
              <h3 className="text-lg font-semibold text-zinc-900">
                No queues yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
                Create your first queue to start managing customers with Qzen.
              </p>

              <Link
                href="/dashboard/queues"
                className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Create Your First Queue
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {queues.map((item) => {
                const { queue, session, waiting, serving, servedToday } = item;

                return (
                  <div
                    key={queue._id.toString()}
                    className="rounded-2xl border border-zinc-200 bg-white p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-zinc-900">
                          {queue.name}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-500">
                          Today
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                          session.status === "active"
                            ? "bg-green-50 text-green-700"
                            : session.status === "paused"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-zinc-50 p-4">
                        <p className="text-xs text-zinc-500">
                          Waiting
                        </p>

                        <p className="mt-1 text-2xl font-bold text-zinc-900">
                          {waiting}
                        </p>
                      </div>

                      <div className="rounded-xl bg-zinc-50 p-4">
                        <p className="text-xs text-zinc-500">
                          Serving
                        </p>

                        <p className="mt-1 text-2xl font-bold text-zinc-900">
                          {serving
                            ? `#${serving.tokenNumber}`
                            : "#0"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-zinc-50 p-4">
                        <p className="text-xs text-zinc-500">
                          Served
                        </p>

                        <p className="mt-1 text-2xl font-bold text-zinc-900">
                          {servedToday}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Link
                        href={`/dashboard/queue/${queue._id.toString()}`}
                        className="block w-full rounded-full bg-black px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-zinc-800"
                      >
                        Open Queue
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}