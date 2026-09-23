"use client";

import { useEffect, useRef } from "react";
import { markNotificationsRead } from "@/actions/account";

/** Marks what the user has just seen as read, without re-rendering the list. */
export function MarkSeen({ ids }: { ids: string[] }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || ids.length === 0) return;
    done.current = true;
    void markNotificationsRead(ids);
  }, [ids]);
  return null;
}
