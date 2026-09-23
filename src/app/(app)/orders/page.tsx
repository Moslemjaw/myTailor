import type { Metadata } from "next";
import { Compass, Package, Plus } from "lucide-react";
import { OrderCard } from "@/components/orders/order-card";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader, RowList } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { LinkTabs } from "@/components/ui/nav-bits";
import { requireViewer } from "@/lib/auth";
import { signImagePaths } from "@/lib/images";
import { getOrders } from "@/lib/queries";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const viewer = await requireViewer();
  const role = viewer.profile.role;
  const sp = await searchParams;
  const tab = sp.tab === "completed" ? "completed" : "active";

  const orders = await getOrders(viewer.id, role);
  const active = orders.filter((o) => o.status !== "completed");
  const completed = orders.filter((o) => o.status === "completed");
  const shown = tab === "active" ? active : completed;
  const images = await signImagePaths(shown.map((o) => o.request?.image_path));

  return (
    <>
      <PageHeader
        title="Orders"
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title="No orders yet"
          description={
            role === "customer"
              ? "Choose an offer on one of your requests and it becomes an order."
              : "When a customer accepts your offer, the order appears here."
          }
          action={
            role === "customer" ? (
              <ButtonLink href="/requests" icon={<Plus className="size-4" />}>View my requests</ButtonLink>
            ) : (
              <ButtonLink href="/browse" icon={<Compass className="size-4" />}>Browse requests</ButtonLink>
            )
          }
        />
      ) : (
        <>
          <LinkTabs
            label="Filter orders"
            active={tab}
            tabs={[
              { key: "active", label: "Active", href: "/orders", count: active.length },
              { key: "completed", label: "Completed", href: "/orders?tab=completed", count: completed.length },
            ]}
          />
          {shown.length ? (
            <RowList>
              {shown.map((o) => (
                <OrderCard key={o.id} order={o} role={role} imageUrl={o.request?.image_path ? images.get(o.request.image_path) : null} />
              ))}
            </RowList>
          ) : (
            <EmptyState
              compact
              title={tab === "active" ? "No active orders" : "No completed orders yet"}
              description={tab === "active" ? "All your orders are complete." : "Finished orders will appear here."}
            />
          )}
        </>
      )}
    </>
  );
}
