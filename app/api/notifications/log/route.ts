import { route, must } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

/** N002: lịch sử gửi (cả trong app và email), gồm số lần thử và trạng thái cuối */
export const GET = route(
  async (req, { db }) => {
    const sp = new URL(req.url).searchParams;
    let q = db.from("notifications").select("id, event_type, severity, channel, target_role, recipient, title_ja, title_vi, body, status, attempts, ops_alert, created_at")
      .order("created_at", { ascending: false }).limit(300);
    if (sp.get("channel")) q = q.eq("channel", sp.get("channel")!);
    if (sp.get("status")) q = q.eq("status", sp.get("status")!);
    return must(await q);
  },
  { roles: PERM.notifyRun }
);
