import type { Metadata } from "next";
import { SignupFlow } from "@/components/auth/signup-flow";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const sp = await searchParams;
  const role = sp.role === "customer" || sp.role === "tailor" ? sp.role : null;
  return <SignupFlow initialRole={role} />;
}
