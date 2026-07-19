import { z } from "zod";

export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name is too long")
    .optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
