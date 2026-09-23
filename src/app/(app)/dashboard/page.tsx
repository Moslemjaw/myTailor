import type { Metadata } from "next";
import { CustomerDashboard } from "@/components/dashboard/customer-dashboard";
import { TailorDashboard } from "@/components/dashboard/tailor-dashboard";
import { requireViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const viewer = await requireViewer();
  const sp = await searchParams;
  const flags = { welcome: sp.welcome === "1", passwordUpdated: sp.password === "updated" };
  return viewer.profile.role === "customer" ? (
    <CustomerDashboard viewer={viewer} flags={flags} />
  ) : (
    <TailorDashboard viewer={viewer} flags={flags} />
  );
}
