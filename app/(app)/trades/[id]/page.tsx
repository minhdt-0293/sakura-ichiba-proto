"use client";
import Link from "next/link";
import { use, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, useApi } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Table, Badge, Loading, ErrorBox, Field, Btn, useAction, ActionResult, useMe, KV, qty, yen, dt, LinkBtn } from "@/components/ui";
import { useLookups } from "@/components/lookups";
import { AuditTable } from "@/components/audit-table";
import { can } from "@/lib/roles";

export default function TradeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const me = useMe();
  const sp = useSearchParams();
  const lk = useLookups();
  const { data, error, reload } = useApi<any>(`/api/trades/${id}`);
  const a = useAction();
  const [cancel, setCancel] = useState<string | null>(null);
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  const x = data.trade;
  const unit = x.lot?.unit;
  const adjusted = x.adjustment_count > 0;
  return (
    <>
      <PageHeader id="T003" ja={`取引詳細：${x.trade_no}`} vi={`Chi tiết giao dịch: ${x.trade_no}`} back="/trades"
        actions={x.status === "CONFIRMED" && (
          <>
            {can(me?.roles, "deliveryWrite") && x.delivery_status !== "COMPLETED" && <LinkBtn href={`/deliveries/${id}`}>{t("引渡しを記録", "Ghi giao hàng")}</LinkBtn>}
            {can(me?.roles, "correctionRequest") && <LinkBtn href={`/corrections/new?trade=${id}`} kind="secondary">{t("訂正を申請", "Yêu cầu sửa")}</LinkBtn>}
            {can(me?.roles, "disputeWrite") && <LinkBtn href={`/disputes/new?trade=${id}&date=${x.biz_date}`} kind="secondary">{t("紛争を登録", "Ghi tranh chấp")}</LinkBtn>}
            {can(me?.roles, "tradeWrite") && <Btn kind="danger" onClick={() => setCancel("")}>{t("取消", "Hủy giao dịch")}</Btn>}
          </>
        )} />
      {sp.get("created") && <div className="alert alert-ok">{t("取引を確定しました。", "Đã chốt giao dịch.")}</div>}
      {data.day_locked && (
        <div className="alert alert-warn">
          {t("この業務日は締め済です。直接の変更・取消はできません。訂正は「訂正申請」から行い、差分レコードとして記録されます。",
             "Ngày nghiệp vụ này đã khóa. Không sửa/hủy trực tiếp được; hãy dùng “Yêu cầu sửa”, thay đổi được ghi thành bản ghi delta.")}
        </div>
      )}
      <ActionResult a={a} />
      {cancel !== null && (
        <Card title={t("取引の取消", "Hủy giao dịch")}>
          <p className="small muted">{t("引渡し記録がなく、締め前の取引のみ取消できます。販売可能数量は元に戻ります。", "Chỉ hủy được giao dịch chưa giao hàng và ngày chưa khóa. Số lượng khả dụng được hoàn lại.")}</p>
          <form className="row" onSubmit={(e) => { e.preventDefault(); a.run(async () => { await api(`/api/trades/${id}/cancel`, { body: { reason: cancel } }); setCancel(null); reload(); }, t("取消しました", "Đã hủy")); }}>
            <Field label={t("取消理由", "Lý do hủy")} required><input value={cancel} onChange={(e) => setCancel(e.target.value)} required style={{ minWidth: 320 }} /></Field>
            <Btn kind="danger" disabled={a.busy}>{t("取消を確定", "Xác nhận hủy")}</Btn>
            <Btn type="button" kind="ghost" onClick={() => setCancel(null)}>{t("閉じる", "Đóng")}</Btn>
          </form>
        </Card>
      )}
      <Card title={t("取引情報", "Thông tin giao dịch")} actions={<div className="row"><Badge group="tradeType" value={x.trade_type} /><Badge group="tradeStatus" value={x.status} /><Badge group="deliveryStatus" value={x.delivery_status} /></div>}>
        <KV items={[
          [t("取引番号", "Mã giao dịch"), <span className="mono">{x.trade_no}</span>],
          [t("業務日", "Ngày nghiệp vụ"), x.biz_date],
          [t("ロット", "Lot"), <Link href={`/lots/${x.lot.id}`}>{x.lot.lot_no} ({lk.mname("ITEM", x.lot.item_code)})</Link>],
          [t("売り手（卸売業者）", "Bên bán"), `${x.seller.code} ${x.seller.name}`],
          [t("買い手", "Bên mua"), <Link href={`/parties/${x.buyer.id}`}>{x.buyer.code} {x.buyer.name}</Link>],
          [t("確定数量（当初）", "Số lượng (gốc)"), qty(x.quantity, unit)],
          [t("確定単価（当初）", "Đơn giá (gốc)"), yen(x.unit_price)],
          [t("金額（当初）", "Thành tiền (gốc)"), yen(x.amount)],
          [t("有効数量（訂正後）", "SL hiệu lực (sau sửa)"), <b>{qty(x.eff_quantity, unit)}</b>],
          [t("有効金額（訂正後）", "Tiền hiệu lực (sau sửa)"), <b>{yen(x.eff_amount)}</b>],
          [t("引渡し済数量", "Đã giao"), `${qty(x.delivered_qty, unit)} / ${qty(x.eff_quantity, unit)}`],
          [t("確定者 / 日時", "Người chốt / lúc"), `${x.confirmed_by_name ?? ""} / ${dt(x.confirmed_at)}`],
          ...(x.trade_type === "SERI" ? [[t("場内番号 / 確認者", "Số trong chợ / người xác nhận"), `${x.seri_board_no ?? ""} / ${x.seri_confirmer ?? ""}`] as [string, string]] : []),
          ...(x.status === "CANCELLED" ? [[t("取消理由", "Lý do hủy"), `${x.cancel_reason} (${x.cancelled_by_name ?? ""} ${dt(x.cancelled_at)})`] as [string, string]] : []),
        ]} />
        {adjusted && <p className="small muted" style={{ marginTop: 10 }}>{t("※ 当初の確定値は変更されません。訂正は下記の差分レコードとして保持されます。", "※ Giá trị gốc không bị ghi đè. Các lần sửa được giữ thành bản ghi delta bên dưới.")}</p>}
      </Card>

      <div className="grid2">
        <Card title={t("引渡し履歴", "Lịch sử giao hàng")}>
          <Table head={["#", t("数量", "SL"), t("例外", "Ngoại lệ"), t("理由", "Lý do"), t("記録者", "Người ghi"), t("日時", "Thời điểm")]} empty={!data.deliveries.length}>
            {data.deliveries.map((d: any) => (
              <tr key={d.id}>
                <td>{d.seq}</td><td className="num">{qty(d.quantity, unit)}</td>
                <td>{d.exception_type && <Badge group="exception" value={d.exception_type} tone="red" />}</td>
                <td className="small">{d.exception_note}</td><td className="small">{d.recorded_by_name}</td><td className="nowrap small">{dt(d.delivered_at)}</td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title={t("訂正（差分レコード）", "Điều chỉnh (bản ghi delta)")}>
          <Table head={[t("申請番号", "Số YC"), t("計上業務日", "Ngày ghi nhận"), t("数量差分", "Delta SL"), t("金額差分", "Delta tiền"), t("新単価", "Đơn giá mới")]} empty={!data.adjustments.length}>
            {data.adjustments.map((d: any) => (
              <tr key={d.id}>
                <td className="mono">{d.correction?.req_no}</td><td>{d.applied_biz_date}</td>
                <td className="num">{Number(d.delta_quantity) > 0 ? "+" : ""}{qty(d.delta_quantity)}</td>
                <td className="num">{Number(d.delta_amount) > 0 ? "+" : ""}{yen(d.delta_amount)}</td>
                <td className="num">{yen(d.new_unit_price)}</td>
              </tr>
            ))}
          </Table>
          {data.corrections.length > 0 && (
            <div className="small" style={{ marginTop: 8 }}>
              {data.corrections.map((c: any) => (
                <div key={c.id}><Link href={`/corrections/${c.id}`} className="mono">{c.req_no}</Link> <Badge group="reqStatus" value={c.status} /> {c.reason}</div>
              ))}
            </div>
          )}
          {data.disputes.length > 0 && (
            <div className="small" style={{ marginTop: 8 }}>
              {t("紛争", "Tranh chấp")}: {data.disputes.map((d: any) => <Link key={d.id} href={`/disputes/${d.id}`} style={{ marginRight: 8 }}>{d.dispute_no}</Link>)}
            </div>
          )}
        </Card>
      </div>

      <Card title={t("監査ログ（この取引）", "Audit log (giao dịch này)")}>
        <AuditTable rows={data.audit} />
      </Card>
    </>
  );
}
