import { route, must, body, str, num } from "@/lib/api-server";
import { PERM } from "@/lib/roles";

/** Ghi một lần giao hàng (cho phép nhiều lần) hoặc ngoại lệ thiếu/thừa/trả/hủy một phần */
export const POST = route(
  async (req, { db, user, params }) => {
    const b = await body(req);
    return must(
      await db.rpc("record_delivery", {
        p_user: user.id, p_trade: params.id,
        p_qty: num(b.quantity, "quantity", { min: 0 }),
        p_exception: str(b.exception_type, "exception_type", false),
        p_note: str(b.note, "note", false),
      })
    );
  },
  { roles: PERM.deliveryWrite, action: "DELIVERY_RECORD" }
);
