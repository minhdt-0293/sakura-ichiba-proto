"use client";
import Link from "next/link";
import { use, useState } from "react";
import { api, useApi } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Table, Badge, Loading, ErrorBox, Field, Btn, useAction, ActionResult, useMe, KV, qty, dt, RoleGate } from "@/components/ui";
import { useLookups } from "@/components/lookups";
import { can } from "@/lib/roles";

export default function RecordDelivery({ params }: { params: Promise<{ tradeId: string }> }) {
  const { tradeId } = use(params);
  const t = useT();
  const me = useMe();
  const lk = useLookups();
  const { data, error, reload } = useApi<any>(`/api/trades/${tradeId}`);
  const a = useAction();
  const [v, setV] = useState<any>({ exception_type: "" });
  const [closeNote, setCloseNote] = useState("");
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  const x = data.trade;
  const unit = x.lot?.unit;
  const remaining = Math.max(0, Number(x.eff_quantity) - Number(x.delivered_qty));
  return (
    <>
      <PageHeader id="D002 / D003" ja="引渡しの記録" vi="Ghi giao hàng" back="/deliveries" />
      <Card>
        <KV items={[
          [t("取引", "Giao dịch"), <Link href={`/trades/${x.id}`} className="mono">{x.trade_no}</Link>],
          [t("品目", "Mặt hàng"), lk.mname("ITEM", x.lot.item_code)],
          [t("買い手", "Bên mua"), `${x.buyer.code} ${x.buyer.name}`],
          [t("取引数量（有効）", "SL giao dịch (hiệu lực)"), qty(x.eff_quantity, unit)],
          [t("引渡し済（累計）", "Đã giao (lũy kế)"), qty(x.delivered_qty, unit)],
          [t("残数量", "Còn lại"), <b>{qty(remaining, unit)}</b>],
          [t("状態", "Trạng thái"), <Badge group="deliveryStatus" value={x.delivery_status} />],
        ]} />
      </Card>
      <ActionResult a={a} />
      <RoleGate ok={can(me?.roles, "deliveryWrite")}>
        {x.status === "CONFIRMED" && x.delivery_status !== "COMPLETED" && x.delivery_status !== "EXCEPTION" && (
          <Card title={t("今回の引渡し", "Lần giao này")}>
            <p className="small muted">{t("分割引渡しが可能です。累計が取引数量と一致した時点で「引渡し完了」になります（BR-DEL-03）。数量が合わない場合は例外として理由を記録します。",
              "Có thể giao nhiều lần. Khi tổng đã giao = số lượng giao dịch thì tự chuyển “Đã giao xong” (BR-DEL-03). Nếu không khớp, ghi ngoại lệ kèm lý do.")}</p>
            <form onSubmit={(e) => { e.preventDefault(); a.run(async () => { await api(`/api/trades/${tradeId}/deliveries`, { body: v }); setV({ exception_type: "" }); reload(); }, t("記録しました", "Đã ghi")); }}>
              <div className="form-grid">
                <Field label={t("引渡し数量", "Số lượng giao")} required hint={`${t("残", "Còn")}: ${qty(remaining, unit)}`}>
                  <div className="row" style={{ flexWrap: "nowrap" }}>
                    <input type="number" min={0} step={0.1} value={v.quantity ?? ""} onChange={(e) => setV({ ...v, quantity: e.target.value })} required />
                    <Btn type="button" kind="secondary" onClick={() => setV({ ...v, quantity: remaining })}>{t("残全量", "Giao hết")}</Btn>
                  </div>
                </Field>
                <Field label={t("例外（D003）", "Ngoại lệ (D003)")}>
                  <select value={v.exception_type} onChange={(e) => setV({ ...v, exception_type: e.target.value })}>
                    <option value="">{t("なし（通常の引渡し）", "Không (giao bình thường)")}</option>
                    {lk.masters("DELIVERY_EXCEPTION").map((m) => <option key={m.code} value={m.code}>{m.label}</option>)}
                  </select>
                </Field>
                <div className="full">
                  <Field label={t("理由・確認内容", "Lý do / nội dung xác nhận")} required={!!v.exception_type}>
                    <textarea value={v.note ?? ""} onChange={(e) => setV({ ...v, note: e.target.value })} required={!!v.exception_type} />
                  </Field>
                </div>
              </div>
              <Btn disabled={a.busy}>{t("引渡しを記録", "Ghi giao hàng")}</Btn>
            </form>
          </Card>
        )}
        {x.delivery_status === "EXCEPTION" && (
          <Card title={t("例外の確認・完了", "Xác nhận đóng ngoại lệ")}>
            <p className="small muted">{t("例外の内容を確認し、関係者と合意できたら完了にします（確認者として記録されます）。数量差異の精算は訂正申請で行います。",
              "Xác nhận ngoại lệ, khi đã thống nhất với các bên thì đóng (bạn được ghi là người xác nhận). Chênh lệch số lượng thì xử lý bằng yêu cầu sửa.")}</p>
            <form className="row" onSubmit={(e) => { e.preventDefault(); a.run(async () => { await api(`/api/trades/${tradeId}/close-exception`, { body: { note: closeNote } }); setCloseNote(""); reload(); }, t("完了しました", "Đã đóng")); }}>
              <Field label={t("確認内容", "Nội dung xác nhận")} required><input value={closeNote} onChange={(e) => setCloseNote(e.target.value)} required style={{ minWidth: 320 }} /></Field>
              <Btn disabled={a.busy}>{t("例外を完了", "Đóng ngoại lệ")}</Btn>
            </form>
          </Card>
        )}
      </RoleGate>
      <Card title={t("引渡し履歴", "Lịch sử giao hàng")}>
        <Table head={["#", t("数量", "SL"), t("例外", "Ngoại lệ"), t("理由", "Lý do"), t("記録者", "Người ghi"), t("日時", "Thời điểm")]} empty={!data.deliveries.length}>
          {data.deliveries.map((d: any) => (
            <tr key={d.id}>
              <td>{d.seq}</td><td className="num">{qty(d.quantity, unit)}</td>
              <td>{d.exception_type && <Badge group="exception" value={d.exception_type} tone="red" />}</td>
              <td className="small">{d.exception_note}</td><td className="small">{d.recorded_by_name}</td><td className="small nowrap">{dt(d.delivered_at)}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
