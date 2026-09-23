import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";

/**
 * Shown for missing records *and* for records the user isn't allowed to see —
 * deliberately the same, so changing an ID in the URL reveals nothing.
 */
export default function AppNotFound() {
  return (
    <EmptyState
      className="mt-6"
      icon={<SearchX />}
      title="This page isn’t available"
      description="It may have been removed, or it belongs to another account. If you followed a link, check that you’re signed in to the right account."
      action={<ButtonLink href="/dashboard">Go to dashboard</ButtonLink>}
    />
  );
}
