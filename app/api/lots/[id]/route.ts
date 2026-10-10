import { route, must, ApiError } from "@/lib/api-server";

export const GET = route(async (_req, { db, params }) => {
  const lot = must(
    await db.from("lots").select("*, wholesaler:parties!lots_wholesaler_id_fkey(id, code, name), receiver:app_users!lots_received_by_fkey(display_name)")
      .eq("id", params.id).maybeSingle()
  );
  if (!lot) throw new ApiError(404, "NOT_FOUND");
  const [ev, tr] = await Promise.all([
    db.from("lot_evaluations").select("*, recorder:app_users!lot_evaluations_recorded_by_fkey(display_name)").eq("lot_id", params.id).order("recorded_at", { ascending: false }),
    db.from("trades_effective").select("id, trade_no, trade_type, quantity, eff_quantity, eff_unit_price, eff_amount, status, delivery_status, buyer:parties!trades_buyer_id_fkey(code, name)")
      .eq("lot_id", params.id).order("trade_no"),
  ]);
  return { lot, evaluations: must(ev), trades: must(tr) };
});
