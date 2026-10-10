import { route, must, body, str } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

/** S008: duyệt (sinh bản ghi delta) hoặc bác. Người lập không được tự duyệt. */
export const POST = route(
  async (req, { db, user, params }) => {
    const b = await body(req);
    return must(
      await db.rpc("review_correction", {
        p_user: user.id, p_req: params.id, p_approve: b.approve === true, p_comment: str(b.comment, "comment", false),
      })
    );
  },
  { roles: PERM.correctionReview, action: "CORRECTION_REVIEW" }
);
