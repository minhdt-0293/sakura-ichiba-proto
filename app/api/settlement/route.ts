import { route, must, date, jstToday } from "@/lib/api-server";
import { SELECT_TRADE } from "@/lib/selects";

/** S001: tổng hợp đối soát 1 ngày + các dòng giao dịch + 14 ngày gần nhất */
export const GET = route(async (req, { db }) => {
  const sp = new URL(req.url).searchParams;
  const d = date(sp.get("date") || jstToday(), "date")!;
  const [summary, lines, adjs, days] = await Promise.all([
    db.rpc("settlement_summary", { p_date: d }),
    db.from("trades_effective").select(SELECT_TRADE).eq("biz_date", d).order("trade_no"),
    db.from("trade_adjustments").select("*, trade:trades(trade_no, biz_date), correction:correction_requests(req_no, reason)").eq("applied_biz_date", d),
    db.from("business_days").select("*").order("biz_date", { ascending: false }).limit(14),
  ]);
  return { summary: must(summary), lines: must(lines), adjustments: must(adjs), days: must(days) };
});
