import JoinQueueForm from "@/components/JoinQueueForm";
import CustomerShell from "@/components/customer/CustomerShell";
import NotFoundCard from "@/components/customer/NotFoundCard";
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
      <CustomerShell>
        <NotFoundCard
          title="Business not found"
          body="This business does not exist."
        />
      </CustomerShell>
    );
  }

  const queue = await Queue.findOne({
    businessId: business._id,
    slug: queueSlug,
    deletedAt: null,
  }).lean();

  if (!queue) {
    return (
      <CustomerShell>
        <NotFoundCard
          title="Queue not found"
          body="This queue may no longer be available."
        />
      </CustomerShell>
    );
  }

  const queueSession = await getOrCreateQueueSession(queue._id.toString());

  if (!queueSession) {
    return (
      <CustomerShell>
        <NotFoundCard
          title="Queue unavailable"
          body={"Today's queue session could not be loaded."}
        />
      </CustomerShell>
    );
  }

  return (
    <CustomerShell>
      <JoinQueueForm
        queueId={queue._id.toString()}
        queueStatus={queueSession.status}
        businessName={business.name}
        queueName={queue.name}
      />
    </CustomerShell>
  );
}
