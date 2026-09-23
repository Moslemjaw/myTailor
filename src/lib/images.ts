import "server-only";
import { createClient } from "./supabase/server";

export const REQUEST_IMAGE_BUCKET = "request-images";

/**
 * Signs private reference images as the current user. Storage RLS decides
 * whether each path may be read, so unrelated images simply fail to sign.
 */
export async function signImagePaths(paths: (string | null | undefined)[], expiresIn = 60 * 60) {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;

  const supabase = await createClient();
  const { data } = await supabase.storage.from(REQUEST_IMAGE_BUCKET).createSignedUrls(unique, expiresIn);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl && !item.error) map.set(item.path, item.signedUrl);
  }
  return map;
}

export async function signImagePath(path: string | null | undefined) {
  if (!path) return null;
  return (await signImagePaths([path])).get(path) ?? null;
}
