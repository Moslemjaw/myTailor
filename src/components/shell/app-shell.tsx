"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardList,
  Compass,
  FileText,
  Home,
  LogOut,
  MessageSquare,
  Package,
  Plus,
  User,
} from "lucide-react";
import { signOut } from "@/actions/auth";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import type { Role } from "@/lib/types";
import { LiveNotifications } from "./live-notifications";

type NavItem = { href: string; label: string; short?: string; icon: React.ReactNode; badgeKey?: "activity" | "offers" };

const NAV: Record<Role, NavItem[]> = {
  customer: [
    { href: "/dashboard", label: "Dashboard", short: "Home", icon: <Home /> },
    { href: "/requests", label: "My requests", short: "Requests", icon: <FileText />, badgeKey: "offers" },
    { href: "/orders", label: "Orders", icon: <Package /> },
    { href: "/messages", label: "Messages", icon: <MessageSquare /> },
    { href: "/activity", label: "Activity", icon: <Bell />, badgeKey: "activity" },
    { href: "/profile", label: "Profile", icon: <User /> },
  ],
  tailor: [
    { href: "/dashboard", label: "Dashboard", short: "Home", icon: <Home /> },
    { href: "/browse", label: "Browse requests", short: "Browse", icon: <Compass /> },
    { href: "/offers", label: "My offers", short: "Offers", icon: <ClipboardList /> },
    { href: "/orders", label: "Orders", icon: <Package /> },
    { href: "/messages", label: "Messages", icon: <MessageSquare /> },
    { href: "/activity", label: "Activity", icon: <Bell />, badgeKey: "activity" },
    { href: "/profile", label: "Profile", icon: <User /> },
  ],
};

// Bottom bar: the five destinations that matter most on a phone.
const MOBILE: Record<Role, string[]> = {
  customer: ["/dashboard", "/requests", "/orders", "/messages", "/activity"],
  tailor: ["/dashboard", "/browse", "/offers", "/orders", "/messages"],
};

export function AppShell({
  role,
  name,
  userId,
  badges,
  children,
}: {
  role: Role;
  name: string;
  userId: string;
  badges: { activity: number; offers: number };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = NAV[role];
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const mobileItems = MOBILE[role].map((h) => items.find((i) => i.href === h)!);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <LiveNotifications userId={userId} />

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line px-4 py-6 lg:flex">
        <Logo href="/dashboard" className="px-2" />
        <nav aria-label="Main" className="mt-10 flex-1">
          <ul className="space-y-1">
            {items.map((item) => {
              const active = isActive(item.href);
              const count = item.badgeKey ? badges[item.badgeKey] : 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition [&_svg]:size-[1.1rem]",
                      active ? "bg-paper font-semibold text-ink shadow-soft ring-1 ring-line" : "text-muted hover:text-ink",
                    )}
                  >
                    <span className={active ? "text-ink" : undefined}>{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {count > 0 ? (
                      <span className="min-w-5 rounded-full bg-accent px-1.5 py-0.5 text-center text-[0.68rem] font-bold text-white">
                        {count > 9 ? "9+" : count}
                        <span className="sr-only"> new</span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3 border-t border-line px-2 pt-4">
          <Avatar name={name} seed={userId} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="text-xs text-muted">{role === "customer" ? "Customer" : "Tailor"}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-full p-2 text-muted transition hover:bg-cream hover:text-ink"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line/70 bg-ivory/90 px-4 backdrop-blur-md lg:hidden">
          <Logo href="/dashboard" />
          <div className="flex items-center gap-1">
            {role === "tailor" ? (
              <Link
                href="/activity"
                className="relative rounded-full p-2.5 text-ink hover:bg-cream"
                aria-label={badges.activity ? `Activity, ${badges.activity} new` : "Activity"}
              >
                <Bell className="size-5" />
                {badges.activity ? <span className="absolute top-2 right-2 size-2 rounded-full bg-accent" aria-hidden /> : null}
              </Link>
            ) : (
              <Link href="/requests/new" className="rounded-full p-2.5 text-ink hover:bg-cream" aria-label="New request">
                <Plus className="size-5" />
              </Link>
            )}
            <Link href="/profile" className="rounded-full p-1" aria-label="Profile">
              <Avatar name={name} seed={userId} size="sm" />
            </Link>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 sm:px-6 md:px-10 md:pt-12 lg:pb-16">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <nav
          aria-label="Main"
          className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur-md lg:hidden"
        >
          <ul className="mx-auto grid max-w-md grid-cols-5">
            {mobileItems.map((item) => {
              const active = isActive(item.href);
              const count = item.badgeKey ? badges[item.badgeKey] : 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex flex-col items-center gap-1 pt-2.5 pb-2 text-[0.68rem] font-semibold transition [&_svg]:size-5",
                      active ? "text-ink" : "text-muted",
                    )}
                  >
                    <span className={cn("rounded-full px-4 py-1 transition", active && "bg-cream")}>{item.icon}</span>
                    {item.short ?? item.label}
                    {count > 0 ? (
                      <span className="absolute top-1.5 left-1/2 ml-2.5 size-2 rounded-full bg-accent" aria-hidden />
                    ) : null}
                    {count > 0 ? <span className="sr-only">, {count} new</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
