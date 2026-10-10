import { route, must, body, str, num, jstToday, ApiError } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

const KINDS = ["WHOLESALER", "INTERMEDIARY", "APPROVED_BUYER", "MARKET_BUYER"];

export const GET = route(async (req, { db }) => {
  const sp = new URL(req.url).searchParams;
  let q = db.from("parties").select("*, qualifications(id, qual_type, qual_no, valid_from, valid_to, status)").order("code");
  if (sp.get("kind")) q = q.eq("kind", sp.get("kind")!);
  if (sp.get("status")) q = q.eq("status", sp.get("status")!);
  const kw = sp.get("q");
  if (kw) q = q.or(`name.ilike.%${kw.replace(/[%,()]/g, "")}%,code.ilike.%${kw.replace(/[%,()]/g, "")}%`);
  const rows = must(await q) as any[];
  const today = jstToday();
  return rows.map((p) => {
    const quals = (p.qualifications ?? []) as any[];
    const valid = quals.find((x) => x.status === "VALID" && x.valid_from <= today && x.valid_to >= today);
    const next = quals.filter((x) => x.status === "VALID").sort((a, b) => (a.valid_to < b.valid_to ? 1 : -1))[0];
    return { ...p, can_trade: p.status === "ACTIVE" && !!valid, current_qual: valid ?? next ?? quals[0] ?? null };
  });
});

export const POST = route(
  async (req, { db, user }) => {
    const b = await body(req);
    const kind = str(b.kind, "kind")!;
    if (!KINDS.includes(kind)) throw new ApiError(400, "CHECK_VIOLATION", "kind");
    const row = {
      code: str(b.code, "code"),
      kind,
      name: str(b.name, "name"),
      name_kana: str(b.name_kana, "name_kana", false),
      phone: str(b.phone, "phone", false),
      email: str(b.email, "email", false),
      address: str(b.address, "address", false),
      participation_limit: num(b.participation_limit, "participation_limit", { min: 0, required: false }),
      note: str(b.note, "note", false),
    };
    const created = must(await db.from("parties").insert(row).select().single());
    await db.rpc("write_audit", { p_actor: user.id, p_action: "PARTY_CREATE", p_entity: "parties", p_entity_id: created.id, p_after: created });
    return created;
  },
  { roles: PERM.partyWrite }
);
