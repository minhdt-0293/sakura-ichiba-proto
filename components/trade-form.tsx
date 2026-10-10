"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, useApi } from "@/lib/api-client";
import { useT, useEnum } from "@/lib/i18n";
import { PageHeader, Card, Field, Btn, useAction, ActionResult, useMe, RoleGate, qty, yen, Notice } from "./ui";
import { useLookups } from "./lookups";
import { can } from "@/lib/roles";

export function TradeForm({ type }: { type: "AITAI" | "SERI" }) {
  const t = useT();
  const e = useEnum();
  const me = useMe();
  const sp = useSearchParams();
  const router = useRouter();
  const lk = useLookups();
  const a = useAction();
  const [v, setV] = useState<any>({ biz_date: me?.today, lot_id: sp.get("lot") ?? "" });
  const { data: lots, reload } = useApi<any[]>(`/api/lots?onsale=1&date=${v.biz_date ?? ""}`);
  const { data: parties } = useApi<any[]>("/api/parties");
  const set = (k: string) => (ev: any) => setV({ ...v, [k]: ev.target.value });
  const lot = useMemo(() => lots?.find((l) => l.id === v.lot_id), [lots, v.lot_id]);
  const buyer = parties?.find((p) => p.id === v.buyer_id);
  const amount = Number(v.quantity) > 0 && Number(v.unit_price) >= 0 ? Math.floor(Number(v.quantity) * Number(v.unit_price)) : null;
  useEffect(() => { if (lots && v.lot_id && !lots.find((l) => l.id === v.lot_id)) setV((x: any) => ({ ...x, lot_id: "" })); }, [lots]); // eslint-disable-line

  const isSeri = type === "SERI";
  return (
    <>
      <PageHeader id={isSeri ? "T004" : "T002"} ja={isSeri ? "せり結果入力" : "相対取引入力"} vi={isSeri ? "Nhập kết quả đấu giá (せり)" : "Ghi giao dịch thỏa thuận (相対取引)"} back="/trades" />
      {isSeri ? (
        <Notice>{t("せりの最終結果（落札者・数量・単価）を、せり人が確定した後に入力します。手やり・符丁の自動読取（OCR/AI）は行いません（FR-SERI-01）。",
          "Nhập kết quả CUỐI của phiên đấu giá (người trúng, số lượng, đơn giá) sau khi người điều phối xác nhận. Hệ thống KHÔNG tự đọc ký hiệu tay/符丁 (không OCR/AI) — FR-SERI-01.")}</Notice>
      ) : (
        <Notice>{t("相対取引は市場の主要な取引方法です（約90%）。確定時に買い手の参加資格（許可／承認／登録）と販売可能数量をシステムが確認します。",
          "相対取引 là luồng giao dịch chính của chợ (~90%). Khi chốt, hệ thống kiểm tra tư cách bên mua (許可/承認/登録) và số lượng khả dụng.")}</Notice>
      )}
      <Card>
        <RoleGate ok={can(me?.roles, "tradeWrite")}>
          <ActionResult a={a} />
          <form onSubmit={(ev) => { ev.preventDefault(); a.run(async () => { const r = await api<any>("/api/trades", { body: { ...v, trade_type: type } }); router.push(`/trades/${r.id}?created=1`); }); }}>
            <div className="form-grid">
              <Field label={t("業務日", "Ngày nghiệp vụ")} required><input type="date" value={v.biz_date ?? ""} onChange={set("biz_date")} required /></Field>
              <Field label={t("ロット（販売中）", "Lot (đang bán)")} required hint={lot ? `${t("販売可能", "Còn bán")}: ${qty(lot.quantity_available, lot.unit)}` : undefined}>
                <select value={v.lot_id} onChange={set("lot_id")} required>
                  <option value="" />
                  {(lots ?? []).map((l) => <option key={l.id} value={l.id}>{l.lot_no} — {lk.mname("ITEM", l.item_code)} ({qty(l.quantity_available, l.unit)}) — {l.wholesaler?.name}</option>)}
                </select>
              </Field>
              <Field label={isSeri ? t("落札者", "Người trúng") : t("買い手", "Bên mua")} required
                hint={buyer && !buyer.can_trade ? t("⚠ この参加者は本日取引資格がありません（確定時に拒否されます）", "⚠ Người này hôm nay không có tư cách hợp lệ (sẽ bị từ chối khi chốt)") : undefined}>
                <select value={v.buyer_id ?? ""} onChange={set("buyer_id")} required>
                  <option value="" />
                  {(parties ?? []).filter((p) => p.kind !== "WHOLESALER").map((p) => (
                    <option key={p.id} value={p.id}>{p.can_trade ? "" : "× "}{p.code} {p.name} [{e("partyKind", p.kind)}]</option>
                  ))}
                </select>
              </Field>
              <Field label={t("数量", "Số lượng")} required><input type="number" min={0.1} step={0.1} value={v.quantity ?? ""} onChange={set("quantity")} required /></Field>
              <Field label={t("単価（円）", "Đơn giá (¥)")} required><input type="number" min={0} step={1} value={v.unit_price ?? ""} onChange={set("unit_price")} required /></Field>
              <Field label={t("金額（切捨て）", "Thành tiền (làm tròn xuống)")}><input value={amount != null ? yen(amount) : ""} readOnly /></Field>
              {isSeri && (
                <>
                  <Field label={t("場内番号", "Số trong chợ (場内番号)")} required><input value={v.seri_board_no ?? ""} onChange={set("seri_board_no")} required /></Field>
                  <Field label={t("結果確認者（せり人）", "Người xác nhận kết quả")} required><input value={v.seri_confirmer ?? ""} onChange={set("seri_confirmer")} required /></Field>
                </>
              )}
              <div className="full"><Field label={t("備考", "Ghi chú")}><input value={v.note ?? ""} onChange={set("note")} /></Field></div>
            </div>
            <div className="row">
              <Btn disabled={a.busy}>{isSeri ? t("せり結果を確定", "Ghi kết quả đấu giá") : t("取引を確定", "Chốt giao dịch")}</Btn>
              <Btn type="button" kind="ghost" onClick={reload}>{t("ロット一覧を更新", "Tải lại lot")}</Btn>
            </div>
          </form>
        </RoleGate>
      </Card>
    </>
  );
}
