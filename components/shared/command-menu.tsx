"use client";

import { useRouter } from "next/navigation";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { useCommandMenu } from "@/features/providers/command-menu-provider";
import { APP_NAV } from "@/lib/navigation";

export function CommandMenu() {
  const router = useRouter();
  const { open, setOpen } = useCommandMenu();

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to a page or action…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {APP_NAV.map((item) => (
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
              {item.shortcut ? (
                <CommandShortcut>{item.shortcut}</CommandShortcut>
              ) : null}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
