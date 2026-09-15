import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { emailOTP } from "better-auth/plugins";
import { Resend } from "resend";

const client = new MongoClient(process.env.MONGODB_URI!);

const db = client.db("qzen");

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
  }),

  baseURL: process.env.BETTER_AUTH_URL,

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  plugins: [
    emailOTP({
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      otpLength: 6,
      expiresIn: 600,
      allowedAttempts: 3,

      async sendVerificationOTP({ email, otp, type }) {
        if (type === "email-verification") {
          await resend.emails.send({
            from: "Qzen <onboarding@resend.dev>",
            to: email,
            subject: "Verify your Qzen email",
            html: `
            <div>
              <h1>Verify your Qzen email</h1>
              <p>Your verification code is:</p>
              <h2>${otp}</h2>
              <p>This code expires in 10 minutes.</p>
            </div>
          `,
          });
        }
      },
    }),
  ],
});
export const getSession = async () => {
  return auth.api.getSession({
    headers: await import("next/headers").then(({ headers }) => headers()),
  });
};
