import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "./LoginForm";

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();
  const { sig } = await searchParams;

  // In an MCP OAuth flow the authorization server redirects here with a
  // signed query (`sig`) even when a session already exists — for example
  // for prompt=login / max_age requests. Render the form in that case so
  // signing in can continue the flow; otherwise keep the original behavior.
  if (session && !sig) {
    redirect("/onboarding");
  }

  return <LoginForm />;
}
