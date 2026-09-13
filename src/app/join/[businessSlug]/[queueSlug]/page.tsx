import JoinQueueForm from "@/components/JoinQueueForm";
import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Queue from "@/models/Queue";
import { getOrCreateQueueSession } from "@/lib/queueSession";

interface JoinPageProps {
  params: Promise<{
    businessSlug: string;
    queueSlug: string;
  }>;
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { businessSlug, queueSlug } = await params;

  await connectDB();

  const business = await Business.findOne({
    slug: businessSlug,
  }).lean();

  if (!business) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900">
            Business not found
          </h1>

          <p className="mt-2 text-zinc-600">This business does not exist.</p>
        </div>
      </main>
    );
  }

  const queue = await Queue.findOne({
    businessId: business._id,
    slug: queueSlug,
  }).lean();

  if (!queue) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900">Queue not found</h1>

          <p className="mt-2 text-zinc-600">
            This queue may no longer be available.
          </p>
        </div>
      </main>
    );
  }

  const queueSession = await getOrCreateQueueSession(queue._id.toString());

if (!queueSession) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-900">
          Queue unavailable
        </h1>

        <p className="mt-2 text-zinc-600">
          Today's queue session could not be loaded.
        </p>
      </div>
    </main>
  );
}

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <section className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Qzen
          </p>

          <h1 className="mt-4 text-3xl font-bold text-zinc-900">
            Join the queue
          </h1>

          <p className="mt-2 text-zinc-600">{business.name}</p>

          <p className="mt-1 text-sm text-zinc-500">{queue.name}</p>
        </div>

        <JoinQueueForm
          queueId={queue._id.toString()}
          queueStatus={queueSession.status}
        />
      </section>
    </main>
  );
}
