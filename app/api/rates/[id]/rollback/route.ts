import { route, must, body, date, ApiError } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

/** Rollback = tạo bản nháp mới có cùng nội dung với version cũ (giả định Q-20), vẫn phải được duyệt */
export const POST = route(
  async (req, { db, user, params }) => {
    const b = await body(req);
    const src = must(await db.from("rate_versions").select("*, rate_tiers(min_amount, rate)").eq("id", params.id).single()) as any;
    if (src.status !== "APPROVED") throw new ApiError(400, "NOT_DRAFT");
    return must(
      await db.rpc("save_rate_version", {
        p_user: user.id, p_id: null, p_effective: date(b.effective_from, "effective_from"),
        p_note: `Rollback → v${src.version_no}`, p_tiers: src.rate_tiers, p_rollback_of: params.id,
      })
    );
  },
  { roles: PERM.rateDraft, action: "RATE_ROLLBACK" }
);
