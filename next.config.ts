import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
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

export default nextConfig;
