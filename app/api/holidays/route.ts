import { route, must, body, date, str } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

export const GET = route(async (_req, { db }) => must(await db.from("holidays").select("*").order("holiday")));

export const POST = route(
  async (req, { db, user }) => {
    const b = await body(req);
    const row = { holiday: date(b.holiday, "holiday"), name: str(b.name, "name") };
    const r = must(await db.from("holidays").insert(row).select().single());
    await db.rpc("write_audit", { p_actor: user.id, p_action: "HOLIDAY_ADD", p_entity: "holidays", p_entity_id: row.holiday, p_after: r });
    return r;
  },
  { roles: PERM.admin }
);

export const DELETE = route(
  async (req, { db, user }) => {
    const d = date(new URL(req.url).searchParams.get("date"), "date")!;
    const before = must(await db.from("holidays").select("*").eq("holiday", d).maybeSingle());
    must(await db.from("holidays").delete().eq("holiday", d));
    await db.rpc("write_audit", { p_actor: user.id, p_action: "HOLIDAY_DELETE", p_entity: "holidays", p_entity_id: d, p_before: before });
    return { ok: true };
  },
  { roles: PERM.admin }
);
