import { route, must } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

/** A003: tra cứu nhật ký thao tác theo đối tượng, hành động, người, kết quả, khoảng ngày */
export const GET = route(
  async (req, { db }) => {
    const sp = new URL(req.url).searchParams;
    let q = db.from("audit_logs").select("*").order("at", { ascending: false }).limit(300);
    if (sp.get("entity")) q = q.eq("entity", sp.get("entity")!);
    if (sp.get("action")) q = q.ilike("action", `%${sp.get("action")!.replace(/[%,()]/g, "")}%`);
    if (sp.get("actor")) q = q.eq("actor_id", sp.get("actor")!);
    if (sp.get("result")) q = q.eq("result", sp.get("result")!);
    if (sp.get("entity_id")) q = q.ilike("entity_id", `%${sp.get("entity_id")!.replace(/[%,()]/g, "")}%`);
    if (sp.get("from")) q = q.gte("at", `${sp.get("from")}T00:00:00+09:00`);
    if (sp.get("to")) q = q.lte("at", `${sp.get("to")}T23:59:59+09:00`);
    const [rows, users] = await Promise.all([q, db.from("app_users").select("id, display_name").order("display_name")]);
    return { rows: must(rows), users: must(users) };
  },
  { roles: PERM.auditRead }
);
