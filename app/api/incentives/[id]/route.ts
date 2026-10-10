import { route, must, ApiError } from "@/lib/api-server";

export const GET = route(async (_req, { db, params }) => {
  const run = must(
    await db.from("incentive_runs").select("*, version:rate_versions(id, version_no, effective_from, rate_tiers(min_amount, rate)), runner:app_users!incentive_runs_run_by_fkey(display_name)")
      .eq("id", params.id).maybeSingle()
  ) as any;
  if (!run) throw new ApiError(404, "NOT_FOUND");
  run.version?.rate_tiers?.sort((a: any, b: any) => a.min_amount - b.min_amount);
  const results = must(await db.from("incentive_results").select("*, party:parties(code, name, kind)").eq("run_id", params.id)) as any[];
  results.sort((a, b) => (a.party.code < b.party.code ? -1 : 1));
  return { run, results };
});
