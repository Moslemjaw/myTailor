import type { Metadata } from "next";
import { RequestComposer } from "@/components/requests/composer/request-composer";
import { BackLink } from "@/components/ui/nav-bits";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Create a request" };

export default async function NewRequestPage() {
  const viewer = await requireRole("customer");
  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <BackLink href="/requests">My requests</BackLink>
        <p className="eyebrow">New request</p>
      </div>
      <RequestComposer userId={viewer.id} mode="create" />
    </>
  );
}
