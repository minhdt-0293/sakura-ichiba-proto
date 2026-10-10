import { route, must, jstToday } from "@/lib/api-server";

/** C002: số liệu tổng quan hôm nay (đọc thật từ DB) */
export const GET = route(async (_req, { db }) => {
  const today = jstToday();
  const lim = new Date(Date.parse(today) + 30 * 86400000).toISOString().slice(0, 10);
  const from7 = new Date(Date.parse(today) - 6 * 86400000).toISOString().slice(0, 10);
  const [summary, lots, corr, disputes, backlog, quals, blocked, week, openDays] = await Promise.all([
    db.rpc("settlement_summary", { p_date: today }),
    db.from("lots").select("status").eq("biz_date", today),
    db.from("correction_requests").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
    db.from("disputes").select("id, due_date, status").neq("status", "RESOLVED"),
    db.from("trades").select("id", { count: "exact", head: true }).eq("status", "CONFIRMED").in("delivery_status", ["PENDING", "PARTIAL", "EXCEPTION"]).lt("biz_date", today),
    db.from("qualifications").select("id", { count: "exact", head: true }).eq("status", "VALID").gte("valid_to", today).lte("valid_to", lim),
    db.from("audit_logs").select("id", { count: "exact", head: true }).eq("result", "BLOCKED").gte("at", `${today}T00:00:00+09:00`),
    db.from("trades_effective").select("biz_date, trade_type, eff_amount").eq("status", "CONFIRMED").gte("biz_date", from7),
    db.from("trades").select("biz_date").lt("biz_date", today),
  ]);
  const lotRows = must(lots) as any[];
  const byStatus: Record<string, number> = {};
  lotRows.forEach((l) => (byStatus[l.status] = (byStatus[l.status] ?? 0) + 1));
  const dRows = must(disputes) as any[];
  const days: Record<string, { AITAI: number; SERI: number }> = {};
  for (let i = 6; i >= 0; i--) days[new Date(Date.parse(today) - i * 86400000).toISOString().slice(0, 10)] = { AITAI: 0, SERI: 0 };
  (must(week) as any[]).forEach((t) => { if (days[t.biz_date]) days[t.biz_date][t.trade_type as "AITAI" | "SERI"] += Number(t.eff_amount); });
  const locked = must(await db.from("business_days").select("biz_date").eq("status", "LOCKED")) as any[];
  const lockedSet = new Set(locked.map((d) => d.biz_date));
  const unlockedPast = Array.from(new Set((must(openDays) as any[]).map((t) => t.biz_date))).filter((d) => !lockedSet.has(d)).sort();
  return {
    today, summary: must(summary), lots: byStatus,
    pending_corrections: corr.count ?? 0,
    open_disputes: dRows.length, overdue_disputes: dRows.filter((d) => d.due_date && d.due_date < today).length,
    delivery_backlog: backlog.count ?? 0, qual_expiring: quals.count ?? 0, blocked_today: blocked.count ?? 0,
    week: Object.entries(days).map(([d, v]) => ({ date: d, ...v })),
    unlocked_past_days: unlockedPast,
  };
});
