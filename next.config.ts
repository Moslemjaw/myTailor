import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost }] : []),
    ],
  },
  experimental: {
    serverActions: {
      // Reference images are uploaded straight to Storage; actions only carry text.
      bodySizeLimit: "1mb",
    },
  },
  poweredByHeader: false,
};

// `*.dev.tsx` pages (the class demo at /demo/secrets) exist only under `next dev`.
export default function config(phase: string): NextConfig {
  return phase === PHASE_DEVELOPMENT_SERVER
    ? { ...nextConfig, pageExtensions: ["dev.tsx", "tsx", "ts", "jsx", "js"] }
    : nextConfig;
}
