import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const SIZE = {
  sm: "size-6 text-xs",
  md: "size-8 text-sm",
  lg: "size-10 text-base",
} as const;

/** Compact MicroManus mark used in shell / empty chrome. */
export function BrandMark({ className, size = "md" }: BrandMarkProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center rounded-lg bg-foreground font-semibold tracking-tight text-background",
        SIZE[size],
        className,
      )}
    >
      M
    </span>
  );
}
