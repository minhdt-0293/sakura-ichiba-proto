import { route, must, body, str } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

export const POST = route(
  async (req, { db, user, params }) => {
    const b = await body(req);
    return must(await db.rpc("cancel_trade", { p_user: user.id, p_trade: params.id, p_reason: str(b.reason, "reason") }));
  },
  { roles: PERM.tradeWrite, action: "TRADE_CANCEL" }
);
