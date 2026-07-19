"use client";

import { useState } from "react";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { APP_NAME } from "@/lib/constants";
import type { Chat } from "@/types/database";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  creditsBalance: number;
  chats: Chat[];
  user: {
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
  };
};

export function AppShell({
  children,
  title,
  creditsBalance,
  chats,
  user,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <div className="hidden md:block">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
          chats={chats}
        />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{APP_NAME} navigation</SheetTitle>
          </SheetHeader>
          <Sidebar
            collapsed={false}
            onToggle={() => setMobileOpen(false)}
            chats={chats}
            className="w-full border-r-0"
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={title}
          creditsBalance={creditsBalance}
          user={user}
          onOpenMobileNav={() => setMobileOpen(true)}
        />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
