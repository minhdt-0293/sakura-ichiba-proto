import { route, csv, must, date, jstToday, ApiError } from "@/lib/api-server";
import { PERM } from "@/lib/roles";
import { accountingRows, ACCOUNTING_COLS } from "@/lib/reports";

/** B003: xuất CSV cho hệ thống kế toán — chỉ cho 業務日 đã khóa (DR-SETTLE-01). Mỗi lần xuất ghi audit. */
export const GET = route(
  async (req, { db, user }) => {
    const sp = new URL(req.url).searchParams;
    const d = date(sp.get("date") || jstToday(), "date")!;
    const locked = must(await db.rpc("is_day_locked", { p_date: d }));
    const rows = await accountingRows(db, d);
    if (sp.get("format") !== "csv") return { date: d, locked, rows };
    if (!locked) throw new ApiError(400, "DAY_NOT_LOCKED");
    await db.rpc("write_audit", {
      p_actor: user.id, p_action: "ACCOUNTING_EXPORT", p_entity: "business_days", p_entity_id: d,
      p_after: { batch_code: rows[0]?.batch_code ?? null, rows: rows.length, total: rows.reduce((s: number, r: any) => s + r.amount, 0) },
    });
    return csv(`accounting_${d}.csv`, ["batch_code", "biz_date", "party_code", "party_name", "amount", "tax", "row_status"],
      rows.map((r: any) => ACCOUNTING_COLS.map((c) => r[c.key])));
  },
  { roles: PERM.accountingExport }
);
