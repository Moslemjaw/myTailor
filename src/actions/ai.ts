"use server";

import { AiError, aiRateLimited, describeGarmentImage } from "@/lib/ai";
import { getViewer } from "@/lib/auth";
import { logError } from "@/lib/errors";
import { REQUEST_IMAGE_BUCKET } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

/**
 * Generates a description *suggestion* for a customer's uploaded reference
 * image. The image is read with the customer's own session, so Storage RLS
 * guarantees they can only analyse images they are allowed to see.
 */
export async function suggestDescription(input: {
  imagePath: string;
  title?: string;
  garmentType?: string;
  notes?: string;
}): Promise<ActionResult<{ suggestion: string }>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please sign in to continue." };
  if (viewer.profile.role !== "customer") {
    return { ok: false, error: "Description suggestions are available when creating a request." };
  }
  if (typeof input.imagePath !== "string" || !input.imagePath.startsWith(`${viewer.id}/`)) {
    return { ok: false, error: "Please upload your reference image again." };
  }
  if (aiRateLimited(viewer.id)) {
    return { ok: false, error: "You’ve asked for a lot of suggestions. Please wait a few minutes and try again." };
  }

  const supabase = await createClient();
  const { data: blob, error } = await supabase.storage.from(REQUEST_IMAGE_BUCKET).download(input.imagePath);
  if (error || !blob) {
    logError("ai.download", error);
    return { ok: false, error: "We couldn’t read your image. Please upload it again." };
  }
  if (blob.size > 8 * 1024 * 1024) return { ok: false, error: "This image is too large to analyse." };

  const mime = blob.type && blob.type.startsWith("image/") ? blob.type : "image/jpeg";
  const dataUrl = `data:${mime};base64,${Buffer.from(await blob.arrayBuffer()).toString("base64")}`;

  try {
    const suggestion = await describeGarmentImage({
      imageDataUrl: dataUrl,
      title: input.title,
      garmentType: input.garmentType,
      notes: input.notes,
    });
    return { ok: true, data: { suggestion } };
  } catch (e) {
    if (e instanceof AiError) {
      if (e.code === "NOT_CLOTHING") {
        return { ok: false, error: "We couldn’t spot a garment in this image. Try a clearer photo, or describe it yourself." };
      }
      if (e.code === "TIMEOUT") {
        return { ok: false, error: "The assistant is taking too long right now. Try again, or write the description yourself." };
      }
    }
    logError("ai.describe", e);
    return { ok: false, error: "The assistant isn’t available right now. You can still write the description yourself." };
  }
}
