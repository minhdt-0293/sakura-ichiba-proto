import { route, must, body } from "@/lib/api-server";

/** C003: thông báo trong app gửi tới vai trò của người dùng hiện tại */
export const GET = route(async (req, { db, user }) => {
  const sp = new URL(req.url).searchParams;
  let q = db.from("notifications").select("*").eq("channel", "IN_APP").in("target_role", user.roles).order("created_at", { ascending: false }).limit(200);
  const rows = must(await q) as any[];
  const list = rows.map((n) => ({ ...n, read: (n.read_by ?? []).includes(user.id), read_by: undefined }));
  if (sp.get("count")) return { unread: list.filter((n) => !n.read).length };
  return list;
});

/** Đánh dấu đã đọc: { id } hoặc { all: true } */
export const POST = route(async (req, { db, user }) => {
  const b = await body<{ id?: string; all?: boolean }>(req);
  let q = db.from("notifications").select("id, read_by").eq("channel", "IN_APP").in("target_role", user.roles);
  if (!b.all) q = q.eq("id", b.id ?? "");
  const rows = must(await q) as any[];
  for (const n of rows.filter((n) => !(n.read_by ?? []).includes(user.id))) {
    await db.from("notifications").update({ read_by: [...(n.read_by ?? []), user.id] }).eq("id", n.id);
  }
  return { updated: rows.length };
});
