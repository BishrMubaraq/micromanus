"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  authenticateWithPassword,
  type AuthFormState,
} from "@/features/auth/actions";
import { OAuthButtons } from "@/features/auth/components/oauth-buttons";
import type { AuthMode } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

const initialState: AuthFormState = {
  error: null,
  message: null,
};

type AuthFormProps = {
  className?: string;
};

export function AuthForm({ className }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>("sign_in");
  const [state, formAction, pending] = useActionState(
    authenticateWithPassword,
    initialState,
  );

  return (
    <div className={cn("w-full space-y-5", className)}>
      <div className="flex rounded-md border border-border p-1">
        <button
          type="button"
          onClick={() => setMode("sign_in")}
          className={cn(
            "flex-1 rounded-sm px-3 py-1.5 text-sm transition-colors",
            mode === "sign_in"
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("sign_up")}
          className={cn(
            "flex-1 rounded-sm px-3 py-1.5 text-sm transition-colors",
            mode === "sign_up"
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Create account
        </button>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="mode" value={mode} />

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            className="h-11 border-border bg-background/60"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={
              mode === "sign_in" ? "current-password" : "new-password"
            }
            required
            minLength={6}
            placeholder="At least 6 characters"
            className="h-11 border-border bg-background/60"
          />
        </div>

        {state.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
        {state.message ? (
          <p className="text-sm text-muted-foreground">{state.message}</p>
        ) : null}

        <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
          {pending
            ? mode === "sign_in"
              ? "Signing in…"
              : "Creating account…"
            : mode === "sign_in"
              ? "Sign in with email"
              : "Create account"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Later
        </span>
        <Separator className="flex-1" />
      </div>

      <OAuthButtons disabled />
      <p className="text-xs text-muted-foreground">
        Email/password is enabled for interim testing. Google and GitHub OAuth
        stay wired and will be turned on next.
      </p>
    </div>
  );
}
