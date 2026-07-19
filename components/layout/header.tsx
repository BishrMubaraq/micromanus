"use client";

import Link from "next/link";
import { CreditCard, LogOut, Menu, Search, Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/features/auth/actions";
import { useCommandMenu } from "@/features/providers/command-menu-provider";
import { ROUTES } from "@/lib/constants";

type HeaderProps = {
  title?: string;
  creditsBalance: number;
  user: {
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
  };
  onOpenMobileNav?: () => void;
};

export function Header({
  title,
  creditsBalance,
  user,
  onOpenMobileNav,
}: HeaderProps) {
  const { setOpen } = useCommandMenu();
  const initials =
    user.fullName
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    user.email?.slice(0, 2).toUpperCase() ||
    "MM";

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border px-4 md:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
      >
        <Menu className="size-4" />
      </Button>

      <div className="min-w-0 flex-1">
        {title ? (
          <h1 className="truncate text-sm font-medium tracking-tight">
            {title}
          </h1>
        ) : null}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="hidden h-8 gap-2 border-border bg-transparent text-muted-foreground sm:inline-flex"
        onClick={() => setOpen(true)}
      >
        <Search className="size-3.5" />
        <span>Search</span>
        <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </Button>

      <Badge
        variant="outline"
        className="h-8 rounded-md border-border bg-transparent px-2.5 font-normal text-muted-foreground"
      >
        <CreditCard className="size-3.5" />
        {creditsBalance.toLocaleString()} credits
      </Badge>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
          >
            <Avatar className="size-7">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.fullName ?? "User"} />
              ) : null}
              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="space-y-1 font-normal">
            <p className="text-sm font-medium">
              {user.fullName ?? "Account"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={ROUTES.settings}>
              <Settings className="size-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={ROUTES.paywall}>
              <CreditCard className="size-4" />
              Billing
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              void signOut();
            }}
          >
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
