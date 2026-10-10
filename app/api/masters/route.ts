import { route, must, body, str, ApiError } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

const CATS = ["ITEM", "UNIT", "GRADE", "DELIVERY_EXCEPTION", "DISPUTE_CAUSE"];

export const GET = route(async (_req, { db }) => must(await db.from("master_items").select("*").order("category").order("sort")));

export const POST = route(
  async (req, { db, user }) => {
    const b = await body(req);
    const category = str(b.category, "category")!;
    if (!CATS.includes(category)) throw new ApiError(400, "CHECK_VIOLATION", "category");
    const row = { category, code: str(b.code, "code")!.toUpperCase(), name_ja: str(b.name_ja, "name_ja"), name_vi: str(b.name_vi, "name_vi"), sort: Number(b.sort) || 0 };
    const r = must(await db.from("master_items").insert(row).select().single());
    await db.rpc("write_audit", { p_actor: user.id, p_action: "MASTER_ADD", p_entity: "master_items", p_entity_id: String(r.id), p_after: r });
    return r;
  },
  { roles: PERM.admin }
);

/** Không xóa vật lý (dữ liệu cũ đang tham chiếu) — chỉ đổi tên / ngừng sử dụng */
export const PUT = route(
  async (req, { db, user }) => {
    const b = await body(req);
    const before = must(await db.from("master_items").select("*").eq("id", b.id).single());
    const r = must(
      await db.from("master_items").update({ name_ja: str(b.name_ja, "name_ja"), name_vi: str(b.name_vi, "name_vi"), sort: Number(b.sort) || 0, active: b.active !== false })
        .eq("id", b.id).select().single()
    );
    await db.rpc("write_audit", { p_actor: user.id, p_action: "MASTER_UPDATE", p_entity: "master_items", p_entity_id: String(b.id), p_before: before, p_after: r });
    return r;
  },
  { roles: PERM.admin }
);
