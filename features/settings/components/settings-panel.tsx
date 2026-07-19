import Link from "next/link";

import { signOut } from "@/features/auth/actions";
import { ProviderSettingsForm } from "@/features/settings/components/provider-settings-form";
import type { UserProviderPublic } from "@/features/providers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { APP_NAME, ROUTES } from "@/lib/constants";

type SettingsPanelProps = {
  email: string | null;
  fullName: string | null;
  creditsBalance: number;
  provider: UserProviderPublic | null;
};

export function SettingsPanel({
  email,
  fullName,
  creditsBalance,
  provider,
}: SettingsPanelProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 overflow-y-auto p-6 md:p-8 h-[calc(100vh-10rem)]">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, model provider, and workspace preferences.
        </p>
      </div>

      <Card className="border-border bg-card/50 shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-medium">Model provider</CardTitle>
          <CardDescription>
            Bring your own OpenAI, Anthropic, or Kimi key. Keys are encrypted at
            rest and never exposed to the browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProviderSettingsForm initial={provider} />
        </CardContent>
      </Card>

      <Card className="border-border bg-card/50 shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-medium">Profile</CardTitle>
          <CardDescription>
            Synced from your GitHub account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{fullName ?? "—"}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Email</span>
            <span className="truncate font-medium">{email ?? "—"}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Credits</span>
            <div className="flex items-center gap-3">
              <span className="font-medium tabular-nums">
                {creditsBalance.toLocaleString()}
              </span>
              <Button asChild size="sm" variant="outline">
                <Link href={`${ROUTES.paywall}?from=settings`}>
                  Add credits
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card/50 shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-medium">Session</CardTitle>
          <CardDescription>
            Sign out of {APP_NAME} on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
