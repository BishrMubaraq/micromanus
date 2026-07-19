import { z } from "zod";

export const oauthProviderSchema = z.enum(["google", "github"]);

export type OAuthProvider = z.infer<typeof oauthProviderSchema>;

export const emailPasswordSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password is too long"),
});

export type EmailPasswordInput = z.infer<typeof emailPasswordSchema>;

export const authModeSchema = z.enum(["sign_in", "sign_up"]);

export type AuthMode = z.infer<typeof authModeSchema>;
