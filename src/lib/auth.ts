import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);

const db = client.db("qzen");

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
  }),

  emailAndPassword: {
    enabled: true,
  },
});

export const getSession = async () => {
  return auth.api.getSession({
    headers: await import("next/headers").then(
      ({ headers }) => headers()
    ),
  });
};