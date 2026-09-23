import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { ActivityItem } from "@/components/activity/activity-item";
import { MarkSeen } from "@/components/activity/mark-read";
import { PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { requireViewer } from "@/lib/auth";
import { getNotifications } from "@/lib/queries";
import type { Notification } from "@/lib/types";

export const metadata: Metadata = { title: "Activity" };

function group(items: Notification[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const week = new Date(today);
  week.setDate(week.getDate() - 7);
  const groups: { label: string; items: Notification[] }[] = [
    { label: "Today", items: [] },
    { label: "This week", items: [] },
    { label: "Earlier", items: [] },
  ];
  for (const n of items) {
    const d = new Date(n.created_at);
    (d >= today ? groups[0] : d >= week ? groups[1] : groups[2]).items.push(n);
  }
  return groups.filter((g) => g.items.length);
}

export default async function ActivityPage() {
  await requireViewer();
  const items = await getNotifications(80);
  const unread = items.filter((n) => !n.read_at).map((n) => n.id);

  return (
    <>
      <PageHeader
        title="Activity"
      />
      <MarkSeen ids={unread} />
      {items.length === 0 ? (
        <EmptyState
          icon={<Bell />}
          title="You’re all caught up"
          description="Updates about offers and orders will appear here as they happen."
        />
      ) : (
        <div className="max-w-3xl space-y-8">
          {group(items).map((g) => (
            <section key={g.label} aria-labelledby={`g-${g.label}`}>
              <h2 id={`g-${g.label}`} className="mb-3 text-sm font-medium text-muted">
                {g.label}
              </h2>
              <div className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper">
                {g.items.map((n) => (
                  <ActivityItem key={n.id} n={n} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
