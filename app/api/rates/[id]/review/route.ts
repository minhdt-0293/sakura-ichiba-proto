import { route, must, body, str } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

/** Duyệt / bác version: người duyệt ≠ người lập, tối đa 4 lần/năm (GOV-RULE-01) */
export const POST = route(
  async (req, { db, user, params }) => {
    const b = await body(req);
    return must(
      await db.rpc("review_rate_version", { p_user: user.id, p_id: params.id, p_approve: b.approve === true, p_comment: str(b.comment, "comment", false) })
    );
  },
  { roles: PERM.rateReview, action: "RATE_REVIEW" }
);
