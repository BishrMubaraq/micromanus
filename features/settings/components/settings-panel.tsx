import { signOut } from "@/features/auth/actions";
import { grantTestCredits } from "@/features/auth/grant-test-credits";
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
import { WELCOME_CREDITS } from "@/lib/env";

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
    <div className="mx-auto max-w-2xl space-y-6 overflow-y-auto p-6 md:p-8">
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
            Bring your own key. MicroManus never ships or exposes provider
            secrets — keys are encrypted at rest.
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
            Synced from your auth provider. OAuth providers will be enabled next.
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
            <span className="font-medium">
              {creditsBalance.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card/50 shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-medium">Test credits</CardTitle>
          <CardDescription>
            Interim grant while Stripe checkout is offline. Adds {WELCOME_CREDITS}{" "}
            credits for research runs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={grantTestCredits}>
            <Button type="submit" variant="outline">
              Add {WELCOME_CREDITS} test credits
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-card/50 shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-medium">Session</CardTitle>
          <CardDescription>Sign out of MicroManus on this device.</CardDescription>
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
