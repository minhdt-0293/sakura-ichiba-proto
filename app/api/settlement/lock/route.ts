import { route, must, body, date, str } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

export const POST = route(
  async (req, { db, user }) => {
    const b = await body(req);
    return must(await db.rpc("lock_business_day", { p_user: user.id, p_date: date(b.date, "date"), p_note: str(b.note, "note", false) }));
  },
  { roles: PERM.settlement, action: "DAY_LOCK" }
);
