import { route, must, body, str } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

export const POST = route(
  async (req, { db, user, params }) => {
    const b = await body(req);
    return must(await db.rpc("close_delivery_exception", { p_user: user.id, p_trade: params.id, p_note: str(b.note, "note") }));
  },
  { roles: PERM.deliveryWrite, action: "DELIVERY_EXCEPTION_CLOSE" }
);
