import { route, must, body, str, date, jstToday } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

export const GET = route(async (req, { db }) => {
  const st = new URL(req.url).searchParams.get("status");
  let q = db.from("disputes").select("*, trade:trades(id, trade_no)").order("created_at", { ascending: false });
  if (st === "OPEN_ALL") q = q.neq("status", "RESOLVED");
  else if (st) q = q.eq("status", st);
  const rows = must(await q) as any[];
  const today = jstToday();
  return rows.map((d) => ({ ...d, overdue: d.status !== "RESOLVED" && d.due_date && d.due_date < today }));
});

export const POST = route(
  async (req, { db, user }) => {
    const b = await body(req);
    const bd = date(b.biz_date, "biz_date")!;
    const { count } = await db.from("disputes").select("id", { count: "exact", head: true }).eq("biz_date", bd);
    const row = {
      dispute_no: `D-${bd.slice(2).replace(/-/g, "")}-${String((count ?? 0) + 1).padStart(2, "0")}`,
      biz_date: bd,
      trade_id: str(b.trade_id, "trade_id", false),
      cause_code: str(b.cause_code, "cause_code"),
      description: str(b.description, "description"),
      assignee: str(b.assignee, "assignee", false),
      due_date: date(b.due_date, "due_date", false),
      created_by: user.id,
    };
    const created = must(await db.from("disputes").insert(row).select().single());
    await db.from("dispute_updates").insert({ dispute_id: created.id, status: "OPEN", note: row.description, updated_by: user.id });
    await db.rpc("write_audit", { p_actor: user.id, p_action: "DISPUTE_CREATE", p_entity: "disputes", p_entity_id: created.id, p_after: created });
    return created;
  },
  { roles: PERM.disputeWrite }
);
