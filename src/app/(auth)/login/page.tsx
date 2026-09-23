import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Notice } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/dashboard";
  const linkError = sp.error === "link";

  return (
    <>
      <h1 className="font-display text-5xl leading-tight text-ink">Welcome back</h1>
      <p className="mt-3 text-muted">Sign in to see your requests, offers and orders.</p>
      {linkError ? (
        <Notice tone="warning" className="mt-6" title="That link didn’t work">
          It may have expired or already been used. Sign in, or request a new link.
        </Notice>
      ) : null}
      <LoginForm next={next} />
      <p className="mt-8 text-center text-sm text-muted">
        New to MyTailor?{" "}
        <Link href="/signup" className="font-semibold text-ink underline decoration-stone underline-offset-4 hover:decoration-ink">
          Create an account
        </Link>
      </p>
    </>
  );
}
