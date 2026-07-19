"use client";

import { motion } from "framer-motion";

import { BrandMark } from "@/components/shared/brand-mark";
import { AuthForm } from "@/features/auth/components/auth-form";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { fadeUp, usePrefersReducedMotion } from "@/lib/motion";

export function LandingPage() {
  const reduced = usePrefersReducedMotion();

  return (
    <div className="relative min-h-svh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.07),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.28] [background-image:linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]"
      />

      <main
        id="main-content"
        className="relative mx-auto flex min-h-svh max-w-5xl flex-col justify-center px-6 py-16 md:px-10"
      >
        <motion.div {...fadeUp(reduced)} className="flex items-center gap-3">
          <BrandMark size="md" />
          <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {APP_NAME}
          </p>
        </motion.div>

        <motion.h1
          {...fadeUp(reduced, 0.06)}
          className="mt-8 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl"
        >
          {APP_TAGLINE}
        </motion.h1>

        <motion.p
          {...fadeUp(reduced, 0.12)}
          className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg"
        >
          An AI research workspace that explores the web, synthesizes trusted information, and generates professional reports—all powered by your own AI providers.
        </motion.p>

        <motion.div
          {...fadeUp(reduced, 0.18)}
          className="mt-10 w-full max-w-sm"
        >
          <AuthForm />
        </motion.div>
      </main>
    </div>
  );
}
