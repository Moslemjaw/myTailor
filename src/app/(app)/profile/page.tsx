import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { signOut } from "@/actions/auth";
import { ProfileForm } from "@/components/profile/profile-form";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { RatingSummary } from "@/components/ui/stars";
import { requireViewer } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getTailorStats } from "@/lib/queries";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const viewer = await requireViewer();
  const { profile } = viewer;
  const isTailor = profile.role === "tailor";

  const stats = isTailor ? await getTailorStats([viewer.id]) : new Map();
  const myStats = stats.get(viewer.id);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Profile" />

      <div className="mb-8 flex items-center gap-4">
        <Avatar name={profile.full_name} seed={viewer.id} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-ink">{profile.full_name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span>{isTailor ? "Tailor" : "Customer"} · since {formatDate(profile.created_at, { day: undefined })}</span>
            {isTailor ? <RatingSummary avg={myStats?.avg_rating ?? null} count={myStats?.review_count ?? 0} className="text-sm" /> : null}
          </div>
        </div>
        {isTailor ? (
          <Link href={`/tailors/${viewer.id}`} className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink sm:inline-flex">
            Public profile <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>

        <div className="space-y-6">
          <Card className="p-6 sm:p-8">
            <h2 className="mb-6 text-[0.95rem] font-semibold text-ink">{isTailor ? "Tailor profile" : "Your details"}</h2>
            <ProfileForm profile={profile} />
          </Card>

          <Card className="p-6 sm:p-8">
            <h2 className="text-[0.95rem] font-semibold text-ink">Account</h2>
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
            <p className="mt-4 text-xs text-muted">Account type is set at sign-up and can’t be changed.</p>
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
  );
}
