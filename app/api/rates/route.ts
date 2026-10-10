import { route, must, body, str, date, jstToday } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

const RATE_SEL = "*, rate_tiers(min_amount, rate), creator:app_users!rate_versions_created_by_fkey(id, display_name), approver:app_users!rate_versions_approved_by_fkey(display_name)";

export const GET = route(async (_req, { db }) => {
  const rows = must(await db.from("rate_versions").select(RATE_SEL).order("version_no", { ascending: false })) as any[];
  const current = must(await db.rpc("effective_rate_version", { p_date: jstToday() }));
  const year = jstToday().slice(0, 4);
  const usedThisYear = rows.filter((r) => r.status === "APPROVED" && String(r.effective_from).startsWith(year)).length;
  return { versions: rows.map((r) => ({ ...r, rate_tiers: [...r.rate_tiers].sort((a: any, b: any) => a.min_amount - b.min_amount) })), current_id: current, used_this_year: usedThisYear };
});

/** R002: tạo bản nháp version tỷ lệ (chưa có hiệu lực cho tới khi được người khác duyệt) */
export const POST = route(
  async (req, { db, user }) => {
    const b = await body<{ effective_from: string; note?: string; tiers: unknown[] }>(req);
    return must(
      await db.rpc("save_rate_version", {
        p_user: user.id, p_id: null, p_effective: date(b.effective_from, "effective_from"),
        p_note: str(b.note, "note", false), p_tiers: b.tiers ?? [],
      })
    );
  },
  { roles: PERM.rateDraft, action: "RATE_DRAFT" }
);
