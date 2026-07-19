"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-svh flex-col items-center justify-center gap-4 bg-[#09090b] px-6 text-center text-[#fafafa]">
        <h1 className="text-xl font-medium tracking-tight">
          MicroManus hit a critical error
        </h1>
        <p className="max-w-md text-sm text-white/60">
          Please reload the application.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-white/15 px-4 py-2 text-sm transition-colors hover:bg-white/5"
        >
          Reload
        </button>
      </body>
    </html>
  );
}
