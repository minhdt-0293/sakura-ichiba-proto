import { route, must, body, str, date } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

/** Thêm 許可/承認/登録. Loại tư cách được DB kiểm tra khớp với loại người tham gia (trigger). */
export const POST = route(
  async (req, { db, user, params }) => {
    const b = await body(req);
    const row = {
      party_id: params.id,
      qual_type: str(b.qual_type, "qual_type"),
      qual_no: str(b.qual_no, "qual_no"),
      valid_from: date(b.valid_from, "valid_from"),
      valid_to: date(b.valid_to, "valid_to"),
      note: str(b.note, "note", false),
    };
    const created = must(await db.from("qualifications").insert(row).select().single());
    await db.rpc("write_audit", { p_actor: user.id, p_action: "QUAL_CREATE", p_entity: "qualifications", p_entity_id: created.id, p_after: created });
    return created;
  },
  { roles: PERM.partyWrite }
);
