import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Scissors, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { BackLink } from "@/components/ui/nav-bits";
import { Stars } from "@/components/ui/stars";
import { requireViewer } from "@/lib/auth";
import { firstName, formatDate, plural } from "@/lib/format";
import { getTailorProfile } from "@/lib/queries";

export const metadata: Metadata = { title: "Tailor profile" };

export default async function TailorProfilePage({ params }: PageProps<"/tailors/[id]">) {
  const { id } = await params;
  const viewer = await requireViewer();
  const data = await getTailorProfile(id);
  if (!data) notFound();
  const { profile, stats, reviews } = data;

  return (
    <>
      <div className="mb-6">
        <BackLink href={viewer.profile.role === "customer" ? "/requests" : "/profile"}>Back</BackLink>
      </div>

      <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
        <aside>
          <Card className="p-6 sm:p-7">
            <Avatar name={profile.full_name} seed={profile.id} size="xl" />
            <h1 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-ink">{profile.full_name}</h1>
            <p className="mt-1 text-sm text-muted">Tailor on MyTailor since {formatDate(profile.created_at, { day: undefined })}</p>

            <dl className="mt-6 grid grid-cols-3 gap-3 border-y border-line py-5 text-center">
              <div>
                <dt className="text-xs text-muted">Rating</dt>
                <dd className="mt-1 text-lg font-semibold text-ink">{stats?.avg_rating ? Number(stats.avg_rating).toFixed(1) : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Reviews</dt>
                <dd className="mt-1 text-lg font-semibold text-ink">{stats?.review_count ?? 0}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Completed</dt>
                <dd className="mt-1 text-lg font-semibold text-ink">{stats?.completed_orders ?? 0}</dd>
              </div>
            </dl>

            <ul className="mt-5 space-y-2.5 text-sm text-ink/85">
              {profile.city ? (
                <li className="flex items-center gap-2">
                  <MapPin className="size-4 text-stone" aria-hidden /> {profile.city}
                </li>
              ) : null}
              {profile.years_experience != null ? (
                <li className="flex items-center gap-2">
                  <Scissors className="size-4 text-stone" aria-hidden /> {plural(profile.years_experience, "year")} of experience
                </li>
              ) : null}
            </ul>

            {profile.specialties.length ? (
              <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Specialties">
                {profile.specialties.map((s) => (
                  <li key={s} className="rounded-full bg-cream px-3 py-1 text-xs font-medium text-ink/80">
                    {s}
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>
        </aside>

        <div className="space-y-8">
          {profile.bio ? (
            <section>
              <h2 className="eyebrow">About</h2>
              <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-ink/85">{profile.bio}</p>
            </section>
          ) : null}

          <section>
            <h2 className="mb-4 text-lg font-semibold text-ink">Reviews from customers</h2>
            {reviews.length ? (
              <ul className="space-y-3">
                {reviews.map((r) => (
                  <li key={r.id}>
                    <Card className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <Stars value={r.rating} />
                        <span className="text-xs text-muted">{formatDate(r.created_at, { year: undefined })}</span>
                      </div>
                      {r.comment ? <p className="mt-3 leading-relaxed text-ink/85">“{r.comment}”</p> : null}
                      <p className="mt-3 text-xs font-medium text-muted">{firstName(r.customer?.full_name)} · verified order</p>
                    </Card>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                compact
                icon={<Star />}
                title="No reviews yet"
                description={`${firstName(profile.full_name)} is new to MyTailor. Reviews appear after completed orders.`}
              />
            )}
          </section>
        </div>
      </div>
    </>
  );
}
