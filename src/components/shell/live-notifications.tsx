"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

/**
 * Listens for the signed-in user's new notifications (RLS-filtered by
 * Realtime) and refreshes server data so offers, orders and statuses appear
 * without a reload.
 */
export function LiveNotifications({ userId }: { userId: string }) {
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload: { new: Record<string, unknown> }) => {
          const title = (payload.new as { title?: string }).title;
          if (title) toast.success(title);
          router.refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // toast is stable enough for this purpose; re-subscribing per render would be wasteful
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, router]);

  return null;
}
