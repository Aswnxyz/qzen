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
    revokeSessionsOnPasswordReset: true,

    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: "Qzen <onboarding@resend.dev>",
        to: user.email,
        subject: "Reset your Qzen password",
        html: `
        <div>
          <h1>Reset your Qzen password</h1>

          <p>We received a request to reset your Qzen password.</p>

          <p>
            Click the button below to create a new password:
          </p>

          <p>
            <a
              href="${url}"
              style="
                display: inline-block;
                padding: 12px 20px;
                background-color: #047857;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
              "
            >
              Reset Password
            </a>
          </p>

          <p>
            If you didn't request a password reset, you can safely ignore this email.
          </p>

          <p>
            This password reset link will expire in 1 hour.
          </p>
        </div>
      `,
      });
    },
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
