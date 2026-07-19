"use client";

import { useRouter } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  MessageSquare,
  Settings,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useCommandMenu } from "@/features/providers/command-menu-provider";
import { ROUTES } from "@/lib/constants";

const NAV_ITEMS = [
  {
    label: "New research",
    href: ROUTES.chat,
    icon: MessageSquare,
  },
  {
    label: "Analytics",
    href: ROUTES.analytics,
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: ROUTES.settings,
    icon: Settings,
  },
  {
    label: "Credits & billing",
    href: ROUTES.paywall,
    icon: CreditCard,
  },
] as const;

export function CommandMenu() {
  const router = useRouter();
  const { open, setOpen } = useCommandMenu();

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search commands…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              onSelect={() => {
                setOpen(false);
                router.push(item.href);
              }}
            >
              <item.icon className="size-4 text-muted-foreground" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Coming soon">
          <CommandItem disabled value="start-deep-research">
            Start deep research
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
