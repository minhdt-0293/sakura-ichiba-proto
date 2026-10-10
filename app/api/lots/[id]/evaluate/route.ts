import { route, must, body, str } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

/** Ghi kết quả 目利き/下見 do con người đánh giá — hệ thống không tự đánh giá (CAP-HUMAN-01) */
export const POST = route(
  async (req, { db, user, params }) => {
    const b = await body(req);
    return must(
      await db.rpc("record_evaluation", {
        p_user: user.id, p_lot: params.id,
        p_grade: str(b.grade, "grade"), p_freshness: str(b.freshness, "freshness", false),
        p_evaluator: str(b.evaluator_name, "evaluator_name"), p_note: str(b.note, "note", false),
      })
    );
  },
  { roles: PERM.lotEvaluate, action: "LOT_EVALUATE" }
);
