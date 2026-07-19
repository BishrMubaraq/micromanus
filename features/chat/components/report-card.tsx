"use client";

import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

type ReportCardProps = {
  reportId: string;
  title: string;
};

export function ReportCard({ reportId, title }: ReportCardProps) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-card/50 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg border border-border">
          <FileText className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">PDF report ready</p>
        </div>
      </div>
      <Button asChild size="sm" variant="outline">
        <a href={`/api/reports/${reportId}/pdf`} download>
          <Download className="size-3.5" />
          Download
        </a>
      </Button>
    </div>
  );
}
