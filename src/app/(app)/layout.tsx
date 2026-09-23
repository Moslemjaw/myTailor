import { AppShell } from "@/components/shell/app-shell";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer();
  const supabase = await createClient();

  const [{ count: unread }, pending] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
    viewer.profile.role === "customer"
      ? supabase
          .from("offers")
          .select("id, requests!inner(status, customer_id)", { count: "exact", head: true })
          .eq("status", "pending")
          .eq("requests.status", "open")
          .eq("requests.customer_id", viewer.id)
      : Promise.resolve({ count: 0 }),
  ]);

  return (
    <AppShell
      role={viewer.profile.role}
      name={viewer.profile.full_name}
      userId={viewer.id}
      badges={{ activity: unread ?? 0, offers: pending.count ?? 0 }}
    >
      {children}
    </AppShell>
  );
}
