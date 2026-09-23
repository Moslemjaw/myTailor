import type { Metadata } from "next";
import { FileText, Plus } from "lucide-react";
import { CustomerRequestCard } from "@/components/requests/request-cards";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader, RowList } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { LinkTabs } from "@/components/ui/nav-bits";
import { requireRole } from "@/lib/auth";
import { signImagePaths } from "@/lib/images";
import { getCustomerRequests } from "@/lib/queries";

export const metadata: Metadata = { title: "My requests" };

export default async function RequestsPage({ searchParams }: PageProps<"/requests">) {
  const viewer = await requireRole("customer");
  const sp = await searchParams;
  const tab = sp.tab === "closed" || sp.tab === "all" ? sp.tab : "open";

  const requests = await getCustomerRequests(viewer.id);
  const open = requests.filter((r) => r.status === "open");
  const closed = requests.filter((r) => r.status === "closed");
  const shown = tab === "open" ? open : tab === "closed" ? closed : requests;
  const images = await signImagePaths(shown.map((r) => r.image_path));

  return (
    <>
      <PageHeader
        title="My requests"
        actions={
          <ButtonLink href="/requests/new" icon={<Plus className="size-4" />}>
            New request
          </ButtonLink>
        }
      />

      {requests.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="You haven’t created any requests yet."
          description="Describe what you’d like made and tailors will send you offers."
          action={<ButtonLink href="/requests/new" icon={<Plus className="size-4" />}>Create your first request</ButtonLink>}
        />
      ) : (
        <>
          <LinkTabs
            label="Filter requests"
            active={tab}
            tabs={[
              { key: "open", label: "Open", href: "/requests", count: open.length },
              { key: "closed", label: "Closed", href: "/requests?tab=closed", count: closed.length },
              { key: "all", label: "All", href: "/requests?tab=all", count: requests.length },
            ]}
          />
          {shown.length ? (
            <RowList>
              {shown.map((r) => (
                <CustomerRequestCard key={r.id} request={r} imageUrl={r.image_path ? images.get(r.image_path) : null} />
              ))}
            </RowList>
          ) : (
            <EmptyState
              compact
              title={tab === "open" ? "No open requests" : "No closed requests yet"}
              description={
                tab === "open"
                  ? "Requests close when you choose a tailor. Post a new one whenever you need something made."
                  : "When you choose a tailor, the request closes and becomes an order."
              }
            />
          )}
        </>
      )}
    </>
  );
}
