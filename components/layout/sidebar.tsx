"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Chat } from "@/types/database";

const NAV = [
  { href: ROUTES.chat, label: "New Chat", icon: Plus, exact: true },
  { href: ROUTES.analytics, label: "Analytics", icon: BarChart3 },
  { href: ROUTES.settings, label: "Settings", icon: Settings },
] as const;

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  chats?: Chat[];
  className?: string;
};

export function Sidebar({
  collapsed,
  onToggle,
  chats = [],
  className,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-64",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center gap-2 px-3",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed ? (
          <Link
            href={ROUTES.chat}
            className="truncate text-sm font-semibold tracking-tight"
          >
            {APP_NAME}
          </Link>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>

      <div className="px-2 pb-3">
        <Button
          asChild
          variant="outline"
          className={cn(
            "w-full justify-start border-sidebar-border bg-transparent",
            collapsed && "justify-center px-0",
          )}
        >
          <Link href={ROUTES.chat}>
            <Plus className="size-4" />
            {!collapsed ? <span>New Chat</span> : null}
          </Link>
        </Button>
      </div>

      <Separator className="bg-sidebar-border" />

      <nav className="flex flex-col gap-1 p-2">
        {NAV.map((item) => {
          const active =
            "exact" in item && item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <Separator className="mt-2 bg-sidebar-border" />

      <div className="flex min-h-0 flex-1 flex-col px-2 py-3">
        {!collapsed ? (
          <p className="mb-2 flex items-center gap-2 px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <MessageSquare className="size-3" />
            Chat History
          </p>
        ) : null}
        <ScrollArea className="flex-1">
          <div className="space-y-1 px-1">
            {chats.length === 0 && !collapsed ? (
              <p className="px-2 py-6 text-xs leading-relaxed text-muted-foreground">
                Your research threads will appear here.
              </p>
            ) : null}
            {chats.map((chat) => {
              const href = `${ROUTES.chat}/${chat.id}`;
              const active = pathname === href;
              return (
                <Link
                  key={chat.id}
                  href={href}
                  title={chat.title}
                  className={cn(
                    "block truncate rounded-md px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                    collapsed && "px-0 text-center",
                  )}
                >
                  {collapsed ? "•" : chat.title}
                </Link>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
