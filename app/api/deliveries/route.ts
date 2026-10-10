import { route, must } from "@/lib/api-server";
import { SELECT_TRADE } from "@/lib/selects";

/** D001: danh sách giao hàng theo trạng thái (mặc định: còn tồn) */
export const GET = route(async (req, { db }) => {
  const sp = new URL(req.url).searchParams;
  const st = sp.get("status") || "PENDING,PARTIAL,EXCEPTION";
  let q = db.from("trades_effective").select(SELECT_TRADE).eq("status", "CONFIRMED")
    .order("biz_date").order("trade_no").limit(500);
  if (st !== "ALL") q = q.in("delivery_status", st.split(","));
  if (sp.get("date")) q = q.eq("biz_date", sp.get("date")!);
  return must(await q);
});
