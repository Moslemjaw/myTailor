"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      className="mt-6"
      icon={<TriangleAlert />}
      title="Something went wrong"
      description="We couldn’t load this page. Please try again — if it keeps happening, come back in a few minutes."
      action={
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={reset} icon={<RotateCcw className="size-4" />}>
            Try again
          </Button>
          <ButtonLink href="/dashboard" variant="secondary">
            Go to dashboard
          </ButtonLink>
        </div>
      }
    />
  );
}
