import type { Metadata } from "next";
import { AgentDemo } from "@/components/demo/agent-demo";

export const metadata: Metadata = {
  title: "Secrets demo",
  robots: { index: false },
};

/**
 * Teaching demo for the "keeping secrets server-side" class.
 * The `.dev.tsx` extension is only routed by `next dev` (see next.config.ts),
 * so this page — and the Path A code that ships a key on purpose — never
 * exists in a production build.
 */
export default function SecretsDemoPage() {
  return <AgentDemo />;
}
