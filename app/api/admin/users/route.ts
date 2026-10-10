import { route, must, body, str, ApiError } from "@/lib/api-server";
import { PERM, ROLES } from "@/lib/roles";

const checkRoles = (r: unknown) => {
  const roles = Array.isArray(r) ? (r as string[]) : [];
  if (!roles.length || roles.some((x) => !(ROLES as readonly string[]).includes(x))) throw new ApiError(400, "REQUIRED", "roles");
  return roles;
};

export const GET = route(async (_req, { db }) => {
  const users = must(await db.from("app_users").select("*").order("created_at")) as any[];
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  const last = Object.fromEntries((data?.users ?? []).map((u) => [u.id, u.last_sign_in_at]));
  return users.map((u) => ({ ...u, last_sign_in_at: last[u.id] ?? null }));
}, { roles: PERM.admin });

/** A002: tạo tài khoản Supabase Auth + hồ sơ vai trò */
export const POST = route(
  async (req, { db, user }) => {
    const b = await body(req);
    const email = str(b.email, "email")!.toLowerCase();
    const password = str(b.password, "password")!;
    if (password.length < 8) throw new ApiError(400, "WEAK_PASSWORD");
    const roles = checkRoles(b.roles);
    const display_name = str(b.display_name, "display_name")!;
    const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name } });
    if (error) throw new ApiError(400, error.message.includes("already") ? "DUPLICATE" : "SERVER_ERROR", error.message);
    const created = must(await db.from("app_users").insert({ id: data.user.id, email, display_name, roles }).select().single());
    await db.rpc("write_audit", { p_actor: user.id, p_action: "USER_CREATE", p_entity: "app_users", p_entity_id: created.id, p_after: created });
    return created;
  },
  { roles: PERM.admin }
);
