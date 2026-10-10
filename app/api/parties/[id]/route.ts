import { route, must, body, str, num, jstToday, ApiError } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

export const GET = route(async (_req, { db, params }) => {
  const party = must(await db.from("parties").select("*").eq("id", params.id).maybeSingle());
  if (!party) throw new ApiError(404, "NOT_FOUND");
  const [quals, reason, trades] = await Promise.all([
    db.from("qualifications").select("*").eq("party_id", params.id).order("valid_to", { ascending: false }),
    db.rpc("party_block_reason", { p_party: params.id, p_date: jstToday() }),
    db.from("trades_effective").select("id, trade_no, trade_type, biz_date, eff_quantity, eff_amount, status, delivery_status, lots(lot_no, item_code, unit)")
      .or(`buyer_id.eq.${params.id},seller_id.eq.${params.id}`).order("confirmed_at", { ascending: false }).limit(20),
  ]);
  return { party, qualifications: must(quals), block_reason: must(reason), trades: must(trades) };
});

export const PUT = route(
  async (req, { db, user, params }) => {
    const b = await body(req);
    const before = must(await db.from("parties").select("*").eq("id", params.id).single());
    const patch = {
      name: str(b.name, "name"),
      name_kana: str(b.name_kana, "name_kana", false),
      phone: str(b.phone, "phone", false),
      email: str(b.email, "email", false),
      address: str(b.address, "address", false),
      participation_limit: num(b.participation_limit, "participation_limit", { min: 0, required: false }),
      status: str(b.status, "status"),
      note: str(b.note, "note", false),
      updated_at: new Date().toISOString(),
    };
    if (before.status !== patch.status && !str(b.reason, "reason", false)) throw new ApiError(400, "REASON_REQUIRED");
    const after = must(await db.from("parties").update(patch).eq("id", params.id).select().single());
    await db.rpc("write_audit", {
      p_actor: user.id, p_action: "PARTY_UPDATE", p_entity: "parties", p_entity_id: params.id,
      p_before: before, p_after: after, p_reason: str(b.reason, "reason", false),
    });
    return after;
  },
  { roles: PERM.partyWrite }
);
