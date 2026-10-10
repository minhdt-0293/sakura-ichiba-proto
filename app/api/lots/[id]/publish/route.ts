import { route, must } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

export const POST = route(
  async (_req, { db, user, params }) => must(await db.rpc("publish_lot", { p_user: user.id, p_lot: params.id })),
  { roles: PERM.lotPublish, action: "LOT_PUBLISH" }
);
