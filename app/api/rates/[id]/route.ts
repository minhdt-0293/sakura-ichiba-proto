import { route, must, body, str, date, ApiError } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

export const GET = route(async (_req, { db, params }) => {
  const v = must(
    await db.from("rate_versions")
      .select("*, rate_tiers(min_amount, rate), creator:app_users!rate_versions_created_by_fkey(id, display_name), approver:app_users!rate_versions_approved_by_fkey(display_name)")
      .eq("id", params.id).maybeSingle()
  ) as any;
  if (!v) throw new ApiError(404, "NOT_FOUND");
  v.rate_tiers.sort((a: any, b: any) => a.min_amount - b.min_amount);
  const audit = must(await db.from("audit_logs").select("*").eq("entity", "rate_versions").eq("entity_id", params.id).order("at"));
  return { version: v, audit };
});

export const PUT = route(
  async (req, { db, user, params }) => {
    const b = await body<{ effective_from: string; note?: string; tiers: unknown[] }>(req);
    return must(
      await db.rpc("save_rate_version", {
        p_user: user.id, p_id: params.id, p_effective: date(b.effective_from, "effective_from"),
        p_note: str(b.note, "note", false), p_tiers: b.tiers ?? [],
      })
    );
  },
  { roles: PERM.rateDraft, action: "RATE_DRAFT" }
);
