import { route, must, body, str, num, date } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

export const GET = route(async (req, { db }) => {
  const sp = new URL(req.url).searchParams;
  let q = db.from("lots").select("*, wholesaler:parties!lots_wholesaler_id_fkey(code, name), lot_evaluations(grade)")
    .order("biz_date", { ascending: false }).order("lot_no", { ascending: false }).limit(300);
  if (sp.get("date")) q = q.eq("biz_date", sp.get("date")!);
  if (sp.get("status")) q = q.eq("status", sp.get("status")!);
  if (sp.get("item")) q = q.eq("item_code", sp.get("item")!);
  if (sp.get("onsale")) q = q.eq("status", "ON_SALE").gt("quantity_available", 0);
  return must(await q);
});

export const POST = route(
  async (req, { db, user }) => {
    const b = await body(req);
    return must(
      await db.rpc("create_lot", {
        p_user: user.id,
        p_biz_date: date(b.biz_date, "biz_date"),
        p_wholesaler: str(b.wholesaler_id, "wholesaler_id"),
        p_item: str(b.item_code, "item_code"),
        p_qty: num(b.quantity, "quantity", { min: 0.1 }),
        p_unit: str(b.unit, "unit"),
        p_origin: str(b.origin, "origin", false),
        p_vessel: str(b.vessel, "vessel", false),
        p_temp_no: str(b.temp_no, "temp_no", false),
        p_note: str(b.note, "note", false),
      })
    );
  },
  { roles: PERM.lotCreate, action: "LOT_CREATE" }
);
