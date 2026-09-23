import type { Metadata } from "next";
import { Compass, Package, Plus } from "lucide-react";
import { OrderCard } from "@/components/orders/order-card";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
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
        eyebrow={role === "customer" ? "Customer" : "Tailor"}
        title="Orders"
        description={
          role === "customer"
            ? "Garments being made for you. Each order has its own private chat with your tailor."
            : "Work you’ve been chosen for. Move each order forward as you go."
        }
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title="No orders yet"
          description={
            role === "customer"
              ? "When you choose a tailor’s offer, your request becomes an order and appears here."
              : "When a customer accepts one of your offers, the order appears here."
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
            <div className="grid gap-3 lg:grid-cols-2">
              {shown.map((o) => (
                <OrderCard key={o.id} order={o} role={role} imageUrl={o.request?.image_path ? images.get(o.request.image_path) : null} />
              ))}
            </div>
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
