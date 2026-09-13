import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import SignUpForm from "./SignUpForm";

export default async function SignUpPage() {
  const session = await getSession();

  if (session) {
    redirect("/onboarding");
  }

  return <SignUpForm />;
}