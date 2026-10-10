import { route, must } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

/** Chạy kiểm tra & sinh thông báo (MOCK thay cho batch định kỳ) */
export const POST = route(
  async (_req, { db, user }) => ({ created: must(await db.rpc("run_notification_checks", { p_user: user.id })) }),
  { roles: PERM.notifyRun }
);
