import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { RequestComposer } from "@/components/requests/composer/request-composer";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { BackLink } from "@/components/ui/nav-bits";
import { requireRole } from "@/lib/auth";
import { signImagePath } from "@/lib/images";
import { getCustomerRequestDetail } from "@/lib/queries";

export const metadata: Metadata = { title: "Edit request" };

export default async function EditRequestPage({ params }: PageProps<"/requests/[id]/edit">) {
  const { id } = await params;
  const viewer = await requireRole("customer");
  const detail = await getCustomerRequestDetail(id, viewer.id);
  if (!detail) notFound();
  const { request, offers, measurements } = detail;

  if (request.status !== "open") {
    return (
      <>
        <div className="mb-8">
          <BackLink href={`/requests/${id}`}>Back to request</BackLink>
        </div>
        <EmptyState
          icon={<Lock />}
          title="This request can no longer be edited"
          description="Requests close when you choose a tailor, so the details stay the same as what was agreed."
          action={<ButtonLink href={`/requests/${id}`} variant="secondary">View request</ButtonLink>}
        />
      </>
    );
  }

  const previewUrl = await signImagePath(request.image_path);

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <BackLink href={`/requests/${id}`}>Back to request</BackLink>
        <p className="eyebrow">Editing</p>
      </div>
      <RequestComposer
        userId={viewer.id}
        mode="edit"
        requestId={id}
        offerCount={offers.length}
        initial={{
          title: request.title,
          garment_type: request.garment_type,
          description: request.description,
          desired_date: request.desired_date,
          image: request.image_path && previewUrl ? { path: request.image_path, previewUrl } : null,
          ai_assisted: request.ai_assisted,
          size: request.size ?? "",
          measurements: Object.fromEntries(Object.entries(measurements ?? {}).map(([k, v]) => [k, String(v)])),
        }}
      />
    </>
  );
}
