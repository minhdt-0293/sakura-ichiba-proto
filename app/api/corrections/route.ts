import { route, must, body, str, num } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

const SEL = "*, trade:trades_effective!correction_requests_trade_id_fkey(id, trade_no, biz_date, trade_type, eff_quantity, eff_unit_price, eff_amount), requester:app_users!correction_requests_requested_by_fkey(display_name), reviewer:app_users!correction_requests_reviewed_by_fkey(display_name)";

export const GET = route(async (req, { db }) => {
  const st = new URL(req.url).searchParams.get("status");
  let q = db.from("correction_requests").select(SEL).order("requested_at", { ascending: false });
  if (st) q = q.eq("status", st);
  return must(await q);
});

/** S006: tạo yêu cầu sửa giao dịch đã chốt — giao dịch gốc KHÔNG đổi cho tới khi được duyệt */
export const POST = route(
  async (req, { db, user }) => {
    const b = await body(req);
    return must(
      await db.rpc("request_correction", {
        p_user: user.id, p_trade: str(b.trade_id, "trade_id"),
        p_new_qty: num(b.new_quantity, "new_quantity", { min: 0.1 }),
        p_new_price: num(b.new_unit_price, "new_unit_price", { min: 0 }),
        p_reason: str(b.reason, "reason"), p_evidence: str(b.evidence_note, "evidence_note", false),
      })
    );
  },
  { roles: PERM.correctionRequest, action: "CORRECTION_REQUEST" }
);
