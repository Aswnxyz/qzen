import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Business from "@/models/Business";

export async function getHomeState() {
  const session = await getSession();

  if (!session) {
    return {
      isAuthenticated: false,
      hasBusiness: false,
    };
  }

  await connectDB();

  const business = await Business.findOne({
    ownerId: session.user.id,
  });

  return {
    isAuthenticated: true,
    hasBusiness: !!business,
  };
}