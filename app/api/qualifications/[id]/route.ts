import { route, must, body, str, date } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

/** Đổi trạng thái (tạm ngừng / thu hồi / khôi phục) hoặc gia hạn — bắt buộc lý do, có audit */
export const PUT = route(
  async (req, { db, user, params }) => {
    const b = await body(req);
    const before = must(await db.from("qualifications").select("*").eq("id", params.id).single());
    const reason = str(b.reason, "reason");
    const after = must(
      await db.from("qualifications")
        .update({ status: str(b.status, "status"), valid_to: date(b.valid_to, "valid_to"), note: str(b.note, "note", false) })
        .eq("id", params.id).select().single()
    );
    await db.rpc("write_audit", {
      p_actor: user.id, p_action: "QUAL_UPDATE", p_entity: "qualifications", p_entity_id: params.id,
      p_before: before, p_after: after, p_reason: reason,
    });
    return after;
  },
  { roles: PERM.partyWrite }
);
