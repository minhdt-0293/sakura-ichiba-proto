import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { must, jstToday, ApiError } from "./api-server";

type Col = { key: string; ja: string; vi: string; num?: boolean };
type Params = { date?: string; period?: string };
export type ReportDef = {
  code: string;
  ja: string;
  vi: string;
  freq: "DAILY" | "MONTHLY" | "EVENT";
  param: "date" | "period" | "none";
  cols: Col[];
  run: (db: SupabaseClient, p: Params) => Promise<Record<string, unknown>[]>;
};

const TT: Record<string, string> = { AITAI: "相対取引", SERI: "せり" };
const monthRange = (period: string) => {
  if (!/^\d{4}-\d{2}$/.test(period)) throw new ApiError(400, "BAD_PERIOD");
  const [y, m] = period.split("-").map(Number);
  const end = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  return [`${period}-01`, end];
};
const sum = (rows: any[], k: string) => rows.reduce((s, r) => s + Number(r[k] ?? 0), 0);

/** Catalog 12 báo cáo cố định (TBL-REPORT-01). Mỗi báo cáo đều đọc dữ liệu thật từ Supabase. */
export const REPORTS: ReportDef[] = [
  {
    code: "RPT-01", ja: "業務日別取引集計", vi: "Tổng hợp giao dịch theo ngày nghiệp vụ", freq: "DAILY", param: "date",
    cols: [
      { key: "trade_type", ja: "取引種別", vi: "Loại giao dịch" }, { key: "count", ja: "件数", vi: "Số GD", num: true },
      { key: "quantity", ja: "数量", vi: "Số lượng", num: true }, { key: "amount", ja: "金額", vi: "Thành tiền", num: true },
      { key: "share", ja: "金額構成比(%)", vi: "Tỷ trọng tiền (%)", num: true },
    ],
    run: async (db, p) => {
      const rows = must(await db.from("trades_effective").select("trade_type, eff_quantity, eff_amount").eq("biz_date", p.date!).eq("status", "CONFIRMED")) as any[];
      const total = sum(rows, "eff_amount");
      const out = ["AITAI", "SERI"].map((t) => {
        const r = rows.filter((x) => x.trade_type === t);
        const amt = sum(r, "eff_amount");
        return { trade_type: TT[t], count: r.length, quantity: sum(r, "eff_quantity"), amount: amt, share: total ? Math.round((amt / total) * 1000) / 10 : 0 };
      });
      out.push({ trade_type: "合計 / Tổng", count: rows.length, quantity: sum(rows, "eff_quantity"), amount: total, share: total ? 100 : 0 });
      return out;
    },
  },
  {
    code: "RPT-02", ja: "ロット履歴・取引状態", vi: "Lịch sử lot và trạng thái giao dịch", freq: "DAILY", param: "date",
    cols: [
      { key: "lot_no", ja: "ロット番号", vi: "Mã lot" }, { key: "item", ja: "品目", vi: "Mặt hàng" }, { key: "status", ja: "状態", vi: "Trạng thái" },
      { key: "initial", ja: "入荷数量", vi: "SL nhập", num: true }, { key: "sold", ja: "販売数量", vi: "SL đã bán", num: true },
      { key: "available", ja: "残数量", vi: "SL còn", num: true }, { key: "trades", ja: "取引件数", vi: "Số GD", num: true },
    ],
    run: async (db, p) => {
      const lots = must(await db.from("lots").select("id, lot_no, item_code, status, quantity_initial, quantity_available, trades(id, status)").eq("biz_date", p.date!).order("lot_no")) as any[];
      return lots.map((l) => ({
        lot_no: l.lot_no, item: l.item_code, status: l.status, initial: l.quantity_initial,
        sold: Number(l.quantity_initial) - Number(l.quantity_available), available: l.quantity_available,
        trades: (l.trades ?? []).filter((t: any) => t.status === "CONFIRMED").length,
      }));
    },
  },
  {
    code: "RPT-03", ja: "参加資格の期限切れ・期限間近（30日）", vi: "Người tham gia hết / sắp hết hạn (30 ngày)", freq: "DAILY", param: "none",
    cols: [
      { key: "code", ja: "コード", vi: "Mã" }, { key: "name", ja: "名称", vi: "Tên" }, { key: "kind", ja: "種別", vi: "Loại" },
      { key: "qual_type", ja: "資格", vi: "Tư cách" }, { key: "qual_no", ja: "番号", vi: "Số" }, { key: "valid_to", ja: "有効期限", vi: "Hết hạn" },
      { key: "status", ja: "状態", vi: "Trạng thái" }, { key: "days_left", ja: "残日数", vi: "Còn (ngày)", num: true },
    ],
    run: async (db) => {
      const today = jstToday();
      const lim = new Date(Date.parse(today) + 30 * 86400000).toISOString().slice(0, 10);
      const rows = must(await db.from("qualifications").select("*, party:parties(code, name, kind)").or(`valid_to.lte.${lim},status.neq.VALID`).order("valid_to")) as any[];
      return rows.map((q) => ({
        code: q.party.code, name: q.party.name, kind: q.party.kind, qual_type: q.qual_type, qual_no: q.qual_no, valid_to: q.valid_to,
        status: q.valid_to < today ? "EXPIRED" : q.status, days_left: Math.round((Date.parse(q.valid_to) - Date.parse(today)) / 86400000),
      }));
    },
  },
  {
    code: "RPT-04", ja: "滞留引渡し・引渡し例外", vi: "Giao hàng tồn đọng và ngoại lệ", freq: "DAILY", param: "none",
    cols: [
      { key: "trade_no", ja: "取引番号", vi: "Mã GD" }, { key: "biz_date", ja: "業務日", vi: "Ngày NV" }, { key: "buyer", ja: "買い手", vi: "Bên mua" },
      { key: "quantity", ja: "取引数量", vi: "SL GD", num: true }, { key: "delivered", ja: "引渡し済", vi: "Đã giao", num: true },
      { key: "remaining", ja: "残", vi: "Còn", num: true }, { key: "delivery_status", ja: "状態", vi: "Trạng thái" },
    ],
    run: async (db) => {
      const rows = must(await db.from("trades_effective").select("trade_no, biz_date, eff_quantity, delivered_qty, delivery_status, buyer:parties!trades_buyer_id_fkey(code, name)")
        .eq("status", "CONFIRMED").in("delivery_status", ["PENDING", "PARTIAL", "EXCEPTION"]).order("biz_date")) as any[];
      return rows.map((t) => ({
        trade_no: t.trade_no, biz_date: t.biz_date, buyer: `${t.buyer.code} ${t.buyer.name}`, quantity: t.eff_quantity,
        delivered: t.delivered_qty, remaining: Number(t.eff_quantity) - Number(t.delivered_qty), delivery_status: t.delivery_status,
      }));
    },
  },
  {
    code: "RPT-05", ja: "日次照合表", vi: "Bảng đối soát ngày", freq: "DAILY", param: "date",
    cols: [
      { key: "trade_no", ja: "取引番号", vi: "Mã GD" }, { key: "trade_type", ja: "種別", vi: "Loại" }, { key: "lot_no", ja: "ロット", vi: "Lot" },
      { key: "buyer", ja: "買い手", vi: "Bên mua" }, { key: "quantity", ja: "数量", vi: "SL", num: true }, { key: "unit_price", ja: "単価", vi: "Đơn giá", num: true },
      { key: "amount", ja: "金額", vi: "Thành tiền", num: true }, { key: "status", ja: "取引状態", vi: "Trạng thái" }, { key: "delivery_status", ja: "引渡し", vi: "Giao hàng" },
      { key: "adjusted", ja: "訂正", vi: "Đã sửa" },
    ],
    run: async (db, p) => {
      const rows = must(await db.from("trades_effective").select("*, lot:lots!trades_lot_id_fkey(lot_no), buyer:parties!trades_buyer_id_fkey(code, name)").eq("biz_date", p.date!).order("trade_no")) as any[];
      return rows.map((t) => ({
        trade_no: t.trade_no, trade_type: TT[t.trade_type], lot_no: t.lot.lot_no, buyer: `${t.buyer.code} ${t.buyer.name}`,
        quantity: t.eff_quantity, unit_price: t.eff_unit_price, amount: t.status === "CONFIRMED" ? t.eff_amount : 0,
        status: t.status, delivery_status: t.delivery_status, adjusted: t.adjustment_count > 0 ? "○" : "",
      }));
    },
  },
  {
    code: "RPT-06", ja: "会計照合用出力", vi: "Bảng xuất cho đối soát kế toán", freq: "DAILY", param: "date",
    cols: ACC_COLS(),
    run: async (db, p) => accountingRows(db, p.date!),
  },
  {
    code: "RPT-07", ja: "完納奨励金 計算結果（期間別）", vi: "Kết quả tính tiền thưởng theo kỳ", freq: "MONTHLY", param: "period",
    cols: [
      { key: "code", ja: "コード", vi: "Mã" }, { key: "name", ja: "参加者", vi: "Người tham gia" }, { key: "paid_on_time", ja: "期日内", vi: "Trong hạn" },
      { key: "eligible_amount", ja: "対象金額", vi: "Số tiền đủ ĐK", num: true }, { key: "rate", ja: "料率(%)", vi: "Tỷ lệ (%)", num: true },
      { key: "incentive_amount", ja: "奨励金", vi: "Tiền thưởng", num: true }, { key: "rate_version", ja: "料率版", vi: "Version" },
    ],
    run: async (db, p) => {
      monthRange(p.period!);
      const run = must(await db.from("incentive_runs").select("id, version:rate_versions(version_no)").eq("period", p.period!).eq("is_latest", true).maybeSingle()) as any;
      if (!run) return [];
      const rows = must(await db.from("incentive_results").select("*, party:parties(code, name)").eq("run_id", run.id)) as any[];
      return rows.sort((a, b) => (a.party.code < b.party.code ? -1 : 1)).map((r) => ({
        code: r.party.code, name: r.party.name, paid_on_time: r.on_time ? "○" : "×", eligible_amount: r.eligible_amount,
        rate: Math.round(Number(r.rate) * 10000) / 100, incentive_amount: r.incentive_amount, rate_version: `v${run.version?.version_no}`,
      }));
    },
  },
  {
    code: "RPT-08", ja: "締め後訂正ログ", vi: "Log điều chỉnh sau khóa", freq: "DAILY", param: "none",
    cols: [
      { key: "applied_biz_date", ja: "計上業務日", vi: "Ngày ghi nhận" }, { key: "trade_no", ja: "取引番号", vi: "Mã GD" },
      { key: "original_date", ja: "元の業務日", vi: "Ngày gốc" }, { key: "req_no", ja: "申請番号", vi: "Số yêu cầu" },
      { key: "delta_quantity", ja: "数量差分", vi: "Delta SL", num: true }, { key: "delta_amount", ja: "金額差分", vi: "Delta tiền", num: true },
      { key: "reason", ja: "理由", vi: "Lý do" }, { key: "approver", ja: "承認者", vi: "Người duyệt" },
    ],
    run: async (db) => {
      const rows = must(await db.from("trade_adjustments").select("*, trade:trades(trade_no, biz_date), correction:correction_requests(req_no, reason), by:app_users!trade_adjustments_created_by_fkey(display_name)").order("created_at", { ascending: false })) as any[];
      return rows.map((a) => ({
        applied_biz_date: a.applied_biz_date, trade_no: a.trade.trade_no, original_date: a.trade.biz_date, req_no: a.correction?.req_no,
        delta_quantity: a.delta_quantity, delta_amount: a.delta_amount, reason: a.correction?.reason, approver: a.by?.display_name,
      }));
    },
  },
  {
    code: "RPT-09", ja: "紛争集計と処理SLA", vi: "Tổng hợp tranh chấp và SLA xử lý", freq: "DAILY", param: "none",
    cols: [
      { key: "dispute_no", ja: "紛争番号", vi: "Số" }, { key: "biz_date", ja: "業務日", vi: "Ngày NV" }, { key: "cause", ja: "原因", vi: "Nguyên nhân" },
      { key: "status", ja: "状態", vi: "Trạng thái" }, { key: "assignee", ja: "担当", vi: "Phụ trách" }, { key: "due_date", ja: "期限", vi: "Hạn" },
      { key: "sla", ja: "SLA", vi: "SLA" },
    ],
    run: async (db) => {
      const today = jstToday();
      const rows = must(await db.from("disputes").select("*").order("biz_date", { ascending: false })) as any[];
      return rows.map((d) => ({
        dispute_no: d.dispute_no, biz_date: d.biz_date, cause: d.cause_code, status: d.status, assignee: d.assignee, due_date: d.due_date,
        sla: d.status === "RESOLVED" ? "OK" : d.due_date && d.due_date < today ? "期限超過 / Quá hạn" : "期限内 / Trong hạn",
      }));
    },
  },
  {
    code: "RPT-10", ja: "参加者別 月次", vi: "Báo cáo tháng theo người tham gia", freq: "MONTHLY", param: "period",
    cols: [
      { key: "code", ja: "コード", vi: "Mã" }, { key: "name", ja: "参加者", vi: "Người tham gia" }, { key: "kind", ja: "種別", vi: "Loại" },
      { key: "aitai_count", ja: "相対 件数", vi: "相対 số GD", num: true }, { key: "seri_count", ja: "せり 件数", vi: "せり số GD", num: true },
      { key: "amount", ja: "購入金額", vi: "Tiền mua", num: true },
    ],
    run: async (db, p) => {
      const [a, b] = monthRange(p.period!);
      const rows = must(await db.from("trades_effective").select("trade_type, eff_amount, buyer:parties!trades_buyer_id_fkey(code, name, kind)").eq("status", "CONFIRMED").gte("biz_date", a).lte("biz_date", b)) as any[];
      const m = new Map<string, any>();
      for (const t of rows) {
        const r = m.get(t.buyer.code) ?? { code: t.buyer.code, name: t.buyer.name, kind: t.buyer.kind, aitai_count: 0, seri_count: 0, amount: 0 };
        r[t.trade_type === "AITAI" ? "aitai_count" : "seri_count"]++;
        r.amount += Number(t.eff_amount);
        m.set(t.buyer.code, r);
      }
      return Array.from(m.values()).sort((x, y) => (x.code < y.code ? -1 : 1));
    },
  },
  {
    code: "RPT-11", ja: "取引種別 月次", vi: "Báo cáo tháng theo loại giao dịch", freq: "MONTHLY", param: "period",
    cols: [
      { key: "trade_type", ja: "取引種別", vi: "Loại GD" }, { key: "count", ja: "件数", vi: "Số GD", num: true },
      { key: "amount", ja: "金額", vi: "Thành tiền", num: true }, { key: "share", ja: "金額構成比(%)", vi: "Tỷ trọng (%)", num: true },
    ],
    run: async (db, p) => {
      const [a, b] = monthRange(p.period!);
      const rows = must(await db.from("trades_effective").select("trade_type, eff_amount").eq("status", "CONFIRMED").gte("biz_date", a).lte("biz_date", b)) as any[];
      const total = sum(rows, "eff_amount");
      return ["AITAI", "SERI"].map((t) => {
        const r = rows.filter((x) => x.trade_type === t);
        const amt = sum(r, "eff_amount");
        return { trade_type: TT[t], count: r.length, amount: amt, share: total ? Math.round((amt / total) * 1000) / 10 : 0 };
      });
    },
  },
  {
    code: "RPT-12", ja: "料率変更と適用版", vi: "Thay đổi quy định và version áp dụng", freq: "EVENT", param: "none",
    cols: [
      { key: "version", ja: "版", vi: "Version" }, { key: "effective_from", ja: "発効日", vi: "Hiệu lực từ" }, { key: "status", ja: "状態", vi: "Trạng thái" },
      { key: "tiers", ja: "料率", vi: "Tỷ lệ" }, { key: "creator", ja: "起票者", vi: "Người lập" }, { key: "approver", ja: "承認者", vi: "Người duyệt" },
    ],
    run: async (db) => {
      const rows = must(await db.from("rate_versions").select("*, rate_tiers(min_amount, rate), creator:app_users!rate_versions_created_by_fkey(display_name), approver:app_users!rate_versions_approved_by_fkey(display_name)").order("version_no", { ascending: false })) as any[];
      return rows.map((v) => ({
        version: `v${v.version_no}`, effective_from: v.effective_from, status: v.status,
        tiers: [...v.rate_tiers].sort((a: any, b: any) => a.min_amount - b.min_amount).map((t: any) => `≥¥${Number(t.min_amount).toLocaleString()}: ${(Number(t.rate) * 100).toFixed(2)}%`).join(" / "),
        creator: v.creator?.display_name, approver: v.approver?.display_name,
      }));
    },
  },
];

function ACC_COLS(): Col[] {
  return [
    { key: "batch_code", ja: "バッチコード", vi: "Batch code" }, { key: "biz_date", ja: "業務日", vi: "Ngày NV" },
    { key: "party_code", ja: "参加者コード", vi: "Mã người tham gia" }, { key: "party_name", ja: "参加者名", vi: "Tên" },
    { key: "amount", ja: "金額（税抜）", vi: "Tiền (chưa thuế)", num: true }, { key: "tax", ja: "消費税", vi: "Thuế", num: true },
    { key: "row_status", ja: "行状態", vi: "Trạng thái dòng" },
  ];
}
export const ACCOUNTING_COLS = ACC_COLS();

/**
 * IF-ACC-01 (giả định Q-09): CSV xuất sau khi khóa 業務日.
 * Dòng CONFIRMED = giao dịch của ngày gộp theo bên mua; dòng ADJUSTED = delta điều chỉnh ghi nhận vào ngày đó.
 * Thuế = floor(tiền × 10%) — MOCK, thuế suất cần xác nhận (Q-06, thực phẩm có thể 8%).
 */
export async function accountingRows(db: SupabaseClient, d: string) {
  const batch = `ACC-${d.replace(/-/g, "")}-01`;
  const [trades, adjs] = await Promise.all([
    db.from("trades").select("amount, buyer:parties!trades_buyer_id_fkey(code, name)").eq("biz_date", d).eq("status", "CONFIRMED"),
    db.from("trade_adjustments").select("delta_amount, trade:trades(buyer:parties!trades_buyer_id_fkey(code, name))").eq("applied_biz_date", d),
  ]);
  const group = (items: { code: string; name: string; amount: number }[], status: string) => {
    const m = new Map<string, any>();
    for (const i of items) {
      const r = m.get(i.code) ?? { batch_code: batch, biz_date: d, party_code: i.code, party_name: i.name, amount: 0, tax: 0, row_status: status };
      r.amount += i.amount;
      m.set(i.code, r);
    }
    return Array.from(m.values()).map((r) => ({ ...r, tax: Math.floor((r.amount * 10) / 100) }));
  };
  const a = group((must(trades) as any[]).map((t) => ({ code: t.buyer.code, name: t.buyer.name, amount: Number(t.amount) })), "CONFIRMED");
  const b = group((must(adjs) as any[]).map((x) => ({ code: x.trade.buyer.code, name: x.trade.buyer.name, amount: Number(x.delta_amount) })), "ADJUSTED");
  return [...a, ...b].sort((x, y) => (x.party_code + x.row_status < y.party_code + y.row_status ? -1 : 1));
}
