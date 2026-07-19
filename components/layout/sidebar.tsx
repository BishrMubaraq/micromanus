"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
} from "lucide-react";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { SIDEBAR_NAV } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { Chat } from "@/types/database";

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
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out",
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
            className="flex min-w-0 items-center gap-2.5"
          >
            <BrandMark size="sm" />
            <span className="truncate text-sm font-semibold tracking-tight">
              {APP_NAME}
            </span>
          </Link>
        ) : (
          <Link href={ROUTES.chat} aria-label={APP_NAME}>
            <BrandMark size="sm" />
          </Link>
        )}
        {!collapsed ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="size-4" />
          </Button>
        ) : null}
      </div>

      {collapsed ? (
        <div className="flex justify-center px-2 pb-3">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="size-4" />
          </Button>
        </div>
      ) : null}

      <div className="px-2 pb-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              variant="outline"
              className={cn(
                "w-full justify-start border-sidebar-border bg-transparent",
                collapsed && "justify-center px-0",
              )}
            >
              <Link href={ROUTES.chat} aria-label="New research">
                <Plus className="size-4" />
                {!collapsed ? <span>New research</span> : null}
              </Link>
            </Button>
          </TooltipTrigger>
          {collapsed ? <TooltipContent side="right">New research</TooltipContent> : null}
        </Tooltip>
      </div>

      <Separator className="bg-sidebar-border" />

      <nav className="flex flex-col gap-1 p-2" aria-label="Primary">
        {SIDEBAR_NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          const link = (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
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

          if (!collapsed) return link;

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <Separator className="mt-2 bg-sidebar-border" />

      <div className="flex min-h-0 flex-1 flex-col px-2 py-3">
        {!collapsed ? (
          <p className="mb-2 flex items-center gap-2 px-2 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
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
              const link = (
                <Link
                  key={chat.id}
                  href={href}
                  title={chat.title}
                  aria-label={chat.title}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block truncate rounded-md px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                    collapsed && "flex items-center justify-center px-0",
                  )}
                >
                  {collapsed ? (
                    <span
                      aria-hidden
                      className="size-1.5 rounded-full bg-current opacity-70"
                    />
                  ) : (
                    chat.title
                  )}
                </Link>
              );

              if (!collapsed) return link;

              return (
                <Tooltip key={chat.id}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[220px]">
                    {chat.title}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
