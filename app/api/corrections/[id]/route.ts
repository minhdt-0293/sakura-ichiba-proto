import { route, must, ApiError } from "@/lib/api-server";

export const GET = route(async (_req, { db, params }) => {
  const r = must(
    await db.from("correction_requests")
      .select("*, requester:app_users!correction_requests_requested_by_fkey(id, display_name), reviewer:app_users!correction_requests_reviewed_by_fkey(display_name)")
      .eq("id", params.id).maybeSingle()
  ) as any;
  if (!r) throw new ApiError(404, "NOT_FOUND");
  const trade = must(
    await db.from("trades_effective").select("*, lot:lots!trades_lot_id_fkey(lot_no, item_code, unit, quantity_available), buyer:parties!trades_buyer_id_fkey(code, name)")
      .eq("id", r.trade_id).single()
  );
  const locked = must(await db.rpc("is_day_locked", { p_date: (trade as any).biz_date }));
  return { request: r, trade, day_locked: locked };
});
