import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";

import { ResearchReportDocument } from "@/features/reports/research-report-document";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getReport } from "@/services/chats";
import { createClient } from "@/services/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const limited = enforceRateLimit({
    key: `pdf:${user.id}`,
    ...RATE_LIMITS.pdf,
  });
  if (limited) return limited;

  const report = await getReport(id, user.id);
  if (!report) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = await renderToBuffer(
    createElement(ResearchReportDocument, {
      title: report.title,
      content: report.content,
      createdAt: report.created_at,
    }),
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slugify(report.title)}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 64) || "micromanus-report"
  );
}
