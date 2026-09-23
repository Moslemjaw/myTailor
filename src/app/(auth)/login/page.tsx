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
      <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-ink">Sign in</h1>
      <p className="mt-1.5 text-muted">Welcome back to MyTailor.</p>

      {linkError ? (
        <Notice tone="warning" className="mt-6" title="That link didn’t work">
          It may have expired or already been used. Sign in, or request a new link.
        </Notice>
      ) : null}

      <LoginForm next={next} />

      <p className="mt-8 border-t border-line pt-6 text-center text-sm text-muted">
        New to MyTailor?{" "}
        <Link href="/signup" className="font-semibold text-ink underline decoration-field underline-offset-4 hover:decoration-ink">
          Create an account
        </Link>
      </p>
    </>
  );
}
