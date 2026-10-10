import { route, must, body, str, date, ApiError } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

export const GET = route(async (_req, { db, params }) => {
  const d = must(await db.from("disputes").select("*, trade:trades(id, trade_no, biz_date)").eq("id", params.id).maybeSingle());
  if (!d) throw new ApiError(404, "NOT_FOUND");
  const upd = must(
    await db.from("dispute_updates").select("*, by:app_users!dispute_updates_updated_by_fkey(display_name)").eq("dispute_id", params.id).order("updated_at")
  );
  return { dispute: d, updates: upd };
});

/** Cập nhật trạng thái / người phụ trách / hạn / kết quả — mỗi lần cập nhật lưu lịch sử */
export const PUT = route(
  async (req, { db, user, params }) => {
    const b = await body(req);
    const before = must(await db.from("disputes").select("*").eq("id", params.id).single()) as any;
    const status = str(b.status, "status")!;
    const resolution = str(b.resolution, "resolution", status === "RESOLVED");
    const note = str(b.note, "note")!;
    const after = must(
      await db.from("disputes").update({
        status, resolution, assignee: str(b.assignee, "assignee", false), due_date: date(b.due_date, "due_date", false),
        updated_at: new Date().toISOString(),
      }).eq("id", params.id).select().single()
    );
    await db.from("dispute_updates").insert({ dispute_id: params.id, status, note, updated_by: user.id });
    await db.rpc("write_audit", { p_actor: user.id, p_action: "DISPUTE_UPDATE", p_entity: "disputes", p_entity_id: params.id, p_before: before, p_after: after, p_reason: note });
    return after;
  },
  { roles: PERM.disputeWrite }
);
