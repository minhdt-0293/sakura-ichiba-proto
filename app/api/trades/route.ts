import { route, must, body, str, num, date, ApiError } from "@/lib/api-server";
import { PERM } from "@/lib/roles";
import { SELECT_TRADE } from "@/lib/selects";


export const GET = route(async (req, { db }) => {
  const sp = new URL(req.url).searchParams;
  let q = db.from("trades_effective").select(SELECT_TRADE).order("confirmed_at", { ascending: false }).limit(500);
  if (sp.get("date")) q = q.eq("biz_date", sp.get("date")!);
  if (sp.get("from")) q = q.gte("biz_date", sp.get("from")!);
  if (sp.get("to")) q = q.lte("biz_date", sp.get("to")!);
  if (sp.get("type")) q = q.eq("trade_type", sp.get("type")!);
  if (sp.get("status")) q = q.eq("status", sp.get("status")!);
  if (sp.get("delivery")) q = q.in("delivery_status", sp.get("delivery")!.split(","));
  if (sp.get("buyer")) q = q.eq("buyer_id", sp.get("buyer")!);
  if (sp.get("q")) q = q.ilike("trade_no", `%${sp.get("q")!.replace(/[%,()]/g, "")}%`);
  return must(await q);
});

/** Chốt 相対取引 hoặc ghi kết quả せり cuối (do người vận hành nhập, không OCR/suy luận) */
export const POST = route(
  async (req, { db, user }) => {
    const b = await body(req);
    const type = str(b.trade_type, "trade_type");
    if (type !== "AITAI" && type !== "SERI") throw new ApiError(400, "BAD_TYPE");
    return must(
      await db.rpc("confirm_trade", {
        p_user: user.id,
        p_type: type,
        p_biz_date: date(b.biz_date, "biz_date"),
        p_lot: str(b.lot_id, "lot_id"),
        p_buyer: str(b.buyer_id, "buyer_id"),
        p_qty: num(b.quantity, "quantity", { min: 0.1 }),
        p_unit_price: num(b.unit_price, "unit_price", { min: 0 }),
        p_board_no: str(b.seri_board_no, "seri_board_no", type === "SERI"),
        p_confirmer: str(b.seri_confirmer, "seri_confirmer", type === "SERI"),
        p_note: str(b.note, "note", false),
      })
    );
  },
  { roles: PERM.tradeWrite, action: "TRADE_CONFIRM" }
);
