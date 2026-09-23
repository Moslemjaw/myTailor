import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LogOut, ShieldCheck } from "lucide-react";
import { signOut } from "@/actions/auth";
import { ProfileForm } from "@/components/profile/profile-form";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { RatingSummary } from "@/components/ui/stars";
import { StatTile } from "@/components/ui/stat";
import { requireViewer } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getCustomerRequests, getMyOffers, getOrders, getTailorStats } from "@/lib/queries";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const viewer = await requireViewer();
  const { profile } = viewer;
  const isTailor = profile.role === "tailor";

  const orders = await getOrders(viewer.id, profile.role);
  const completed = orders.filter((o) => o.status === "completed").length;
  const [requests, offers, stats] = await Promise.all([
    isTailor ? Promise.resolve([]) : getCustomerRequests(viewer.id),
    isTailor ? getMyOffers(viewer.id) : Promise.resolve([]),
    isTailor ? getTailorStats([viewer.id]) : Promise.resolve(new Map()),
  ]);
  const myStats = stats.get(viewer.id);

  return (
    <>
      <PageHeader eyebrow="Account" title="Profile" />

      <div className="grid gap-8 lg:grid-cols-[20rem_1fr]">
        <aside className="space-y-4">
          <Card className="p-6 text-center">
            <Avatar name={profile.full_name} seed={viewer.id} size="xl" className="mx-auto" />
            <p className="mt-4 text-lg font-semibold text-ink">{profile.full_name}</p>
            <div className="mt-2 flex justify-center">
              <Badge tone="accent">{isTailor ? "Tailor account" : "Customer account"}</Badge>
            </div>
            {isTailor ? (
              <div className="mt-3 flex justify-center">
                <RatingSummary avg={myStats?.avg_rating ?? null} count={myStats?.review_count ?? 0} />
              </div>
            ) : null}
            <p className="mt-4 text-xs text-muted">Member since {formatDate(profile.created_at, { day: undefined })}</p>
            {isTailor ? (
              <Link href={`/tailors/${viewer.id}`} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-accent">
                View public profile <ExternalLink className="size-3.5" aria-hidden />
              </Link>
            ) : null}
          </Card>

          <div className="grid grid-cols-2 gap-3">
            {isTailor ? (
              <>
                <StatTile label="Offers sent" value={offers.length} href="/offers" />
                <StatTile label="Completed orders" value={completed} href="/orders?tab=completed" />
              </>
            ) : (
              <>
                <StatTile label="Requests" value={requests.length} href="/requests?tab=all" />
                <StatTile label="Completed orders" value={completed} href="/orders?tab=completed" />
              </>
            )}
          </div>
        </aside>

        <div className="space-y-6">
          <Card className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-ink">{isTailor ? "Your tailor profile" : "Your details"}</h2>
            <p className="mt-1 mb-6 text-sm text-muted">
              {isTailor
                ? "This is what customers see alongside your offers."
                : "Tailors see your name on orders and your city on your requests."}
            </p>
            <ProfileForm profile={profile} />
          </Card>

          <Card className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-ink">Account</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-muted">Email</dt>
                <dd className="font-medium text-ink">{viewer.email}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-muted">Account type</dt>
                <dd className="font-medium text-ink capitalize">{profile.role}</dd>
              </div>
            </dl>
            <p className="mt-5 flex items-start gap-2 rounded-2xl bg-ivory p-4 text-xs leading-relaxed text-muted">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              Your account type was chosen when you signed up and can’t be changed. To use MyTailor in the other role,
              create a separate account.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-6">
              <Link href="/reset-password" className="inline-flex h-11 items-center rounded-full border border-line px-5 text-sm font-semibold text-ink hover:border-stone">
                Change password
              </Link>
              <form action={signOut}>
                <Button type="submit" variant="ghost" icon={<LogOut className="size-4" />}>
                  Sign out
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
