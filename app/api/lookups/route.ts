import { route, must } from "@/lib/api-server";

/** Dữ liệu cho dropdown: người tham gia, danh mục, user */
export const GET = route(async (_req, { db }) => {
  const [parties, masters] = await Promise.all([
    db.from("parties").select("id, code, name, kind, status").order("code"),
    db.from("master_items").select("category, code, name_ja, name_vi, sort").eq("active", true).order("sort"),
  ]);
  return { parties: must(parties), masters: must(masters) };
});
