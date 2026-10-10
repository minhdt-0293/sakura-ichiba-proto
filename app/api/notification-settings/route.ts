import { route, must, body, ApiError } from "@/lib/api-server";
import { PERM, ROLES } from "@/lib/roles";

export const GET = route(async (_req, { db }) => must(await db.from("notification_settings").select("*").order("event_type")), { roles: PERM.notifyRun });

/** N001: đổi cấu hình không xóa lịch sử gửi trước đó (FR-NOTIFY-03) */
export const PUT = route(
  async (req, { db, user }) => {
    const b = await body<any>(req);
    const roles: string[] = Array.isArray(b.recipient_roles) ? b.recipient_roles : [];
    if (roles.some((r) => !(ROLES as readonly string[]).includes(r))) throw new ApiError(400, "CHECK_VIOLATION", "roles");
    const before = must(await db.from("notification_settings").select("*").eq("event_type", b.event_type).single());
    const after = must(
      await db.from("notification_settings").update({
        enabled: !!b.enabled, email_enabled: !!b.email_enabled, recipient_roles: roles,
        threshold_days: Math.max(0, Number(b.threshold_days) || 0), severity: b.severity === "CRITICAL" ? "CRITICAL" : "INFO",
        updated_by: user.id, updated_at: new Date().toISOString(),
      }).eq("event_type", b.event_type).select().single()
    );
    await db.rpc("write_audit", { p_actor: user.id, p_action: "NOTIFY_SETTING_UPDATE", p_entity: "notification_settings", p_entity_id: b.event_type, p_before: before, p_after: after });
    return after;
  },
  { roles: PERM.notifySettings }
);
