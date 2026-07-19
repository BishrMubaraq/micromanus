"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import {
  formatDuration,
  formatUsd,
} from "@/features/analytics/pricing";
import { AnalyticsEmpty } from "@/features/analytics/components/analytics-empty";
import type { AnalyticsDashboard } from "@/services/analytics";
import { cn } from "@/lib/utils";

const PROVIDER_LABEL: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  kimi: "Kimi",
};

type AnalyticsDashboardProps = {
  data: AnalyticsDashboard;
};

export function AnalyticsDashboardView({ data }: AnalyticsDashboardProps) {
  const hasActivity = data.rows.length > 0 || data.totalChats > 0;

  return (
    <div className="overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-8 md:py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8"
        >
          <h1 className="text-xl font-medium tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Credits, spend, and research usage across your workspace.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            label="Credits Remaining"
            value={data.creditsRemaining.toLocaleString()}
          />
          <StatCard
            label="Today's Cost"
            value={formatUsd(data.todayCostUsd)}
          />
          <StatCard label="Total Cost" value={formatUsd(data.totalCostUsd)} />
          <StatCard
            label="Total Chats"
            value={data.totalChats.toLocaleString()}
          />
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="mt-8"
        >
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium tracking-tight">Usage</h2>
            <p className="text-xs text-muted-foreground">
              Estimated from model token pricing
            </p>
          </div>

          {!hasActivity || data.rows.length === 0 ? (
            <div className="rounded-xl border border-border bg-card/30">
              <AnalyticsEmpty />
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card/30">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
                      <th className="px-4 py-3 font-medium">Chat</th>
                      <th className="px-4 py-3 font-medium">Provider</th>
                      <th className="px-4 py-3 font-medium">Model</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Input Tokens
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Output Tokens
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Cache Tokens
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Credits Used
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Estimated Cost
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-right font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, index) => (
                      <tr
                        key={row.id}
                        className={cn(
                          "border-b border-border/70 transition-colors last:border-0 hover:bg-foreground/[0.03]",
                          index % 2 === 1 && "bg-foreground/[0.015]",
                        )}
                      >
                        <td className="max-w-[220px] truncate px-4 py-3">
                          {row.chatId ? (
                            <Link
                              href={`/chat/${row.chatId}`}
                              className="font-medium text-foreground/90 underline-offset-4 hover:underline"
                            >
                              {row.chatTitle}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">
                              {row.chatTitle}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {PROVIDER_LABEL[row.provider] ?? row.provider}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[12px] text-foreground/85">
                            {row.model}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums text-muted-foreground">
                          {row.inputTokens.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums text-muted-foreground">
                          {row.outputTokens.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums text-muted-foreground">
                          {row.cacheTokens.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {row.creditsUsed}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {formatUsd(row.estimatedCostUsd)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {formatDuration(row.durationMs)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {formatDate(row.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 px-4 py-4">
      <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-medium tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
