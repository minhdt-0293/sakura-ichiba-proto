import { route, csv, jstToday, ApiError, date } from "@/lib/api-server";
import { REPORTS } from "@/lib/reports";

/** B002: chạy báo cáo, trả JSON hoặc CSV (?format=csv) */
export const GET = route(async (req, { db, params }) => {
  const def = REPORTS.find((r) => r.code === params.code);
  if (!def) throw new ApiError(404, "NOT_FOUND");
  const sp = new URL(req.url).searchParams;
  const p = {
    date: def.param === "date" ? date(sp.get("date") || jstToday(), "date")! : undefined,
    period: def.param === "period" ? sp.get("period") || jstToday().slice(0, 7) : undefined,
  };
  const rows = await def.run(db, p);
  const lang = sp.get("lang") === "vi" ? "vi" : "ja";
  if (sp.get("format") === "csv") {
    return csv(`${def.code}_${p.date ?? p.period ?? jstToday()}.csv`, def.cols.map((c) => c[lang]), rows.map((r) => def.cols.map((c) => r[c.key] as any)));
  }
  const { run, ...meta } = def;
  return { meta, params: p, rows };
});
