import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile, Role } from "./types";

export interface Viewer {
  id: string;
  email: string;
  profile: Profile;
}

/** The signed-in user and their profile, once per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, city, bio, specialties, years_experience, created_at")
    .eq("id", claims.sub)
    .maybeSingle<Profile>();

  if (!profile) return null;
  return { id: claims.sub, email: (claims.email as string) ?? "", profile };
});

export async function requireViewer(next?: string) {
  const viewer = await getViewer();
  if (!viewer) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return viewer;
}

/**
 * Route-level role guard for a clean experience. Data access is still
 * decided by RLS, so a wrong role would simply get no rows.
 */
export async function requireRole(role: Role) {
  const viewer = await requireViewer();
  if (viewer.profile.role !== role) redirect("/dashboard");
  return viewer;
}
