"use client";

import { OAuthButtons } from "@/features/auth/components/oauth-buttons";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

type AuthFormProps = {
  className?: string;
};

export function AuthForm({ className }: AuthFormProps) {
  return (
    <div className={cn("w-full space-y-4", className)}>
      <OAuthButtons />
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        Sign in with GitHub to continue to {APP_NAME}.
      </p>
    </div>
  );
}
