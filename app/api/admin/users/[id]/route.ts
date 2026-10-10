import { route, must, body, str, ApiError } from "@/lib/api-server";
import { PERM, ROLES } from "@/lib/roles";

/** Đổi vai trò / khóa-mở khóa / đặt lại mật khẩu — thao tác nhạy cảm, bắt buộc lý do + audit */
export const PUT = route(
  async (req, { db, user, params }) => {
    const b = await body(req);
    const reason = str(b.reason, "reason")!;
    const roles = Array.isArray(b.roles) ? (b.roles as string[]) : [];
    if (!roles.length || roles.some((x) => !(ROLES as readonly string[]).includes(x))) throw new ApiError(400, "REQUIRED", "roles");
    const active = b.active !== false;
    if (params.id === user.id && !active) throw new ApiError(400, "CANNOT_DEACTIVATE_SELF");
    const before = must(await db.from("app_users").select("*").eq("id", params.id).single());
    const after = must(
      await db.from("app_users").update({ display_name: str(b.display_name, "display_name"), roles, active, updated_at: new Date().toISOString() })
        .eq("id", params.id).select().single()
    );
    const pw = str(b.password, "password", false);
    if (pw) {
      if (pw.length < 8) throw new ApiError(400, "WEAK_PASSWORD");
      const { error } = await db.auth.admin.updateUserById(params.id, { password: pw });
      if (error) throw new ApiError(400, "SERVER_ERROR", error.message);
    }
    // Khóa tài khoản: chặn đăng nhập ở tầng Auth (ban) — mở lại thì gỡ ban
    await db.auth.admin.updateUserById(params.id, { ban_duration: active ? "none" : "876000h" });
    await db.rpc("write_audit", {
      p_actor: user.id, p_action: "USER_UPDATE", p_entity: "app_users", p_entity_id: params.id,
      p_before: before, p_after: { ...after, password_reset: !!pw }, p_reason: reason,
    });
    return after;
  },
  { roles: PERM.admin }
);
