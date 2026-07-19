import { z } from "zod";

export const oauthProviderSchema = z.enum(["github"]);

export type OAuthProvider = z.infer<typeof oauthProviderSchema>;
