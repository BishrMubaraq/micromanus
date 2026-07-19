import {
  BarChart3,
  CreditCard,
  MessageSquarePlus,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/lib/constants";

export type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  shortcut?: string;
};

/** Primary app navigation — shared by sidebar + command menu. */
export const APP_NAV: AppNavItem[] = [
  {
    href: ROUTES.chat,
    label: "New research",
    icon: MessageSquarePlus,
    exact: true,
    shortcut: "N",
  },
  {
    href: ROUTES.analytics,
    label: "Analytics",
    icon: BarChart3,
    shortcut: "A",
  },
  {
    href: ROUTES.settings,
    label: "Settings",
    icon: Settings,
    shortcut: "S",
  },
  {
    href: ROUTES.paywall,
    label: "Billing",
    icon: CreditCard,
    shortcut: "B",
  },
];

/** Sidebar secondary links — New research uses the dedicated CTA above. */
export const SIDEBAR_NAV = APP_NAV.filter(
  (item) => item.href !== ROUTES.paywall && item.href !== ROUTES.chat,
);
