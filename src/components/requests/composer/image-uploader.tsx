"use client";

import { useId, useRef, useState } from "react";
import { Camera, ImagePlus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { ACCEPTED_IMAGE_TYPES, MAX_ORIGINAL_BYTES, resizeImage } from "@/lib/image-resize";
import { createClient } from "@/lib/supabase/client";

export type UploadedImage = { path: string; previewUrl: string };

/**
 * Drag-and-drop on desktop, camera/library picker on phones. Images are
 * resized in the browser, then uploaded straight to the customer's own
 * private Storage folder (enforced by Storage RLS).
 */
export function ImageUploader({
  userId,
  value,
  onChange,
}: {
  userId: string;
  value: UploadedImage | null;
  onChange: (img: UploadedImage | null) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "uploading">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_ORIGINAL_BYTES) {
      setError("This image is larger than 20 MB. Please choose a smaller one.");
      return;
    }

    try {
      setStatus("processing");
      const blob = await resizeImage(file);
      setStatus("uploading");
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from("request-images")
        .upload(path, blob, { contentType: "image/jpeg", cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;

      // Tidy up a previous upload from this session that was never attached to a request.
      if (value?.path && value.path !== path) {
        void supabase.storage.from("request-images").remove([value.path]);
      }
      if (value?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(value.previewUrl);
      onChange({ path, previewUrl: URL.createObjectURL(blob) });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(
        msg === "UNREADABLE_IMAGE"
          ? "We couldn’t read this image. Try a different photo."
          : "Your image didn’t upload. Check your connection and try again.",
      );
    } finally {
      setStatus("idle");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove() {
    if (value?.path) {
      // Only succeeds for images not yet attached to a request (Storage policy).
      void createClient().storage.from("request-images").remove([value.path]);
    }
    if (value?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(value.previewUrl);
    onChange(null);
  }

  const busy = status !== "idle";
  const input = (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      accept={ACCEPTED_IMAGE_TYPES.join(",")}
      className="sr-only"
      onChange={(e) => handleFile(e.target.files?.[0])}
      disabled={busy}
    />
  );

  if (value && !busy) {
    return (
      <div>
        <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-cream">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.previewUrl} alt="Your reference image" className="mx-auto max-h-[26rem] w-full object-contain" />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {input}
          <Button variant="secondary" size="sm" icon={<RefreshCw className="size-4" />} onClick={() => inputRef.current?.click()}>
            Replace image
          </Button>
          <Button variant="ghost" size="sm" icon={<Trash2 className="size-4" />} onClick={remove}>
            Remove
          </Button>
        </div>
        {error ? <Notice tone="danger" className="mt-4" live>{error}</Notice> : null}
      </div>
    );
  }

  return (
    <div>
      {input}
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed px-6 py-10 text-center transition",
          "has-[:focus-visible]:ring-2",
          dragging ? "border-accent bg-accent-soft/60" : "border-sand bg-paper hover:border-stone hover:bg-white",
          busy && "pointer-events-none",
        )}
        aria-busy={busy}
      >
        {busy ? (
          <>
            <Spinner className="size-7 text-accent" />
            <p className="mt-4 font-semibold text-ink" role="status">
              {status === "processing" ? "Preparing your image…" : "Uploading…"}
            </p>
                      </>
        ) : (
          <>
            <span className="flex size-12 items-center justify-center rounded-xl bg-cream text-charcoal">
              <ImagePlus className="size-5" strokeWidth={1.5} aria-hidden />
            </span>
            <p className="mt-5 font-semibold text-ink">
              <span className="hidden md:inline">Drag a photo here, or </span>
              <span className="underline decoration-stone underline-offset-4">
                <span className="md:hidden">Take or choose a photo</span>
                <span className="hidden md:inline">browse your files</span>
              </span>
            </p>
            <p className="mt-1.5 text-sm text-muted">JPG, PNG or WebP</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted md:hidden">
              <Camera className="size-3.5" aria-hidden /> Camera or photo library
            </span>
          </>
        )}
      </label>
      {error ? <Notice tone="danger" className="mt-4" live>{error}</Notice> : null}
    </div>
  );
}
