import { route, must, ApiError } from "@/lib/api-server";
import { SELECT_TRADE } from "@/lib/selects";

export const GET = route(async (_req, { db, params }) => {
  const trade = must(await db.from("trades_effective").select(SELECT_TRADE).eq("id", params.id).maybeSingle()) as any;
  if (!trade) throw new ApiError(404, "NOT_FOUND");
  const [dels, adjs, corrs, audits, disputes, users, day] = await Promise.all([
    db.from("deliveries").select("*").eq("trade_id", params.id).order("seq"),
    db.from("trade_adjustments").select("*, correction:correction_requests(req_no)").eq("trade_id", params.id).order("created_at"),
    db.from("correction_requests").select("id, req_no, status, new_quantity, new_unit_price, reason, requested_at").eq("trade_id", params.id).order("requested_at"),
    db.from("audit_logs").select("*").eq("entity", "trades").eq("entity_id", params.id).order("at"),
    db.from("disputes").select("id, dispute_no, status, cause_code").eq("trade_id", params.id),
    db.from("app_users").select("id, display_name"),
    db.rpc("is_day_locked", { p_date: trade.biz_date }),
  ]);
  const names = Object.fromEntries((must(users) as any[]).map((u) => [u.id, u.display_name]));
  return {
    trade: { ...trade, confirmed_by_name: names[trade.confirmed_by], cancelled_by_name: names[trade.cancelled_by] },
    day_locked: must(day),
    deliveries: (must(dels) as any[]).map((d) => ({ ...d, recorded_by_name: names[d.recorded_by] })),
    adjustments: must(adjs),
    corrections: must(corrs),
    audit: must(audits),
    disputes: must(disputes),
  };
});
