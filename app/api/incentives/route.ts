import { route, must, body, str } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

export const GET = route(async (_req, { db }) => {
  const [runs, periods] = await Promise.all([
    db.from("incentive_runs").select("*, version:rate_versions(version_no), runner:app_users!incentive_runs_run_by_fkey(display_name)").order("run_at", { ascending: false }),
    db.from("payments").select("period"),
  ]);
  const ps = Array.from(new Set((must(periods) as any[]).map((p) => p.period))).sort().reverse();
  return { runs: must(runs), periods: ps };
});

/** R003: chạy tính 完納奨励金 cho một kỳ (kết quả lưu thành lần chạy mới, lần cũ giữ lại) */
export const POST = route(
  async (req, { db, user }) => {
    const b = await body(req);
    return must(await db.rpc("run_incentive", { p_user: user.id, p_period: str(b.period, "period") }));
  },
  { roles: PERM.incentiveRun, action: "INCENTIVE_RUN" }
);
