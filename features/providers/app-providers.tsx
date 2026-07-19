"use client";

import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommandMenuProvider } from "@/features/providers/command-menu-provider";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      forcedTheme="dark"
      disableTransitionOnChange
    >
      <TooltipProvider delayDuration={200}>
        <CommandMenuProvider>
          {children}
          <Toaster />
        </CommandMenuProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
