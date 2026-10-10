"use client";
import Link from "next/link";
import { use, useState } from "react";
import { api, useApi } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Table, Badge, Loading, ErrorBox, Field, Btn, useAction, ActionResult, useMe, KV, qty, yen, dt, RoleGate, LinkBtn } from "@/components/ui";
import { useLookups } from "@/components/lookups";
import { can } from "@/lib/roles";

const FLOW = ["RECEIVED", "INSPECTED", "ON_SALE", "SOLD_OUT"];

export default function LotDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const me = useMe();
  const lk = useLookups();
  const { data, error, reload } = useApi<any>(`/api/lots/${id}`);
  const a = useAction();
  const [ev, setEv] = useState<any>({});
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  const l = data.lot;
  const idx = FLOW.indexOf(l.status);
  return (
    <>
      <PageHeader id="L003 / L004" ja={`ロット詳細：${l.lot_no}`} vi={`Chi tiết lot: ${l.lot_no}`} back="/lots"
        actions={
          <>
            {l.status === "INSPECTED" && can(me?.roles, "lotPublish") && (
              <Btn disabled={a.busy} onClick={() => a.run(async () => { await api(`/api/lots/${id}/publish`, { body: {} }); reload(); }, t("販売中にしました", "Đã chuyển sang đang bán"))}>
                {t("販売開始（公開）", "Mở bán (công khai)")}
              </Btn>
            )}
            {l.status === "ON_SALE" && can(me?.roles, "tradeWrite") && (
              <>
                <LinkBtn href={`/trades/aitai/new?lot=${id}`}>{t("相対取引を入力", "Ghi GD thỏa thuận")}</LinkBtn>
                <LinkBtn href={`/trades/seri/new?lot=${id}`} kind="secondary">{t("せり結果を入力", "Nhập kết quả せり")}</LinkBtn>
              </>
            )}
          </>
        } />
      <div className="flow">
        {FLOW.map((s, i) => <span key={s} className={i < idx ? "done" : i === idx ? "cur" : ""}><Badge group="lotStatus" value={s} tone="gray" /></span>)}
      </div>
      <ActionResult a={a} />
      <Card title={t("ロット情報", "Thông tin lot")}>
        <KV items={[
          [t("ロット番号", "Mã lot"), <span className="mono">{l.lot_no}</span>],
          [t("仮番号", "Mã tạm"), l.temp_no],
          [t("業務日", "Ngày nghiệp vụ"), l.biz_date],
          [t("卸売業者", "Đơn vị bán buôn"), <Link href={`/parties/${l.wholesaler.id}`}>{l.wholesaler.code} {l.wholesaler.name}</Link>],
          [t("品目", "Mặt hàng"), lk.mname("ITEM", l.item_code)],
          [t("産地 / 船名", "Xuất xứ / tàu"), `${l.origin ?? ""} / ${l.vessel ?? ""}`],
          [t("入荷数量", "SL nhập"), qty(l.quantity_initial, l.unit)],
          [t("販売可能数量", "SL còn bán"), <b>{qty(l.quantity_available, l.unit)}</b>],
          [t("受付者", "Người tiếp nhận"), l.receiver?.display_name],
          [t("受付日時", "Thời điểm tiếp nhận"), dt(l.created_at)],
        ]} />
      </Card>

      <Card title={<>{t("評価結果（目利き・下見）", "Kết quả đánh giá (目利き・下見)")} <span className="screen-id">L004</span></>}>
        <div className="alert alert-info">
          {t("鮮度・品質の判断は目利き（人）が行います。システムは判断せず、結果・評価者・記録時刻のみを記録します（CAP-HUMAN-01）。",
             "Đánh giá độ tươi/chất lượng do người thẩm định (con người) quyết định. Hệ thống không tự đánh giá, chỉ ghi kết quả, người đánh giá và thời điểm (CAP-HUMAN-01).")}
        </div>
        <Table head={[t("等級", "Hạng"), t("鮮度", "Độ tươi"), t("評価者", "Người đánh giá"), t("記録者", "Người ghi"), t("記録日時", "Thời điểm"), t("備考", "Ghi chú")]} empty={!data.evaluations.length}>
          {data.evaluations.map((e: any) => (
            <tr key={e.id}>
              <td>{lk.mname("GRADE", e.grade)}</td><td>{e.freshness}</td><td>{e.evaluator_name}</td>
              <td>{e.recorder?.display_name}</td><td className="nowrap">{dt(e.recorded_at)}</td><td className="small">{e.note}</td>
            </tr>
          ))}
        </Table>
        <RoleGate ok={can(me?.roles, "lotEvaluate")}>
          {l.status !== "RECEIVED" && <p className="small muted">{t("※ 評価済ロットへの追記は監査ログに「評価後の更新」として記録されます。", "※ Ghi thêm sau khi đã đánh giá sẽ được log là “cập nhật sau đánh giá”.")}</p>}
          <form className="form-grid" style={{ marginTop: 12 }} onSubmit={(e) => { e.preventDefault(); a.run(async () => { await api(`/api/lots/${id}/evaluate`, { body: ev }); setEv({}); reload(); }, t("評価結果を記録しました", "Đã ghi kết quả đánh giá")); }}>
            <Field label={t("等級", "Hạng")} required>
              <select value={ev.grade ?? ""} onChange={(e) => setEv({ ...ev, grade: e.target.value })} required>
                <option value="" />
                {lk.masters("GRADE").map((m) => <option key={m.code} value={m.code}>{m.label}</option>)}
              </select>
            </Field>
            <Field label={t("鮮度（所見）", "Độ tươi (nhận xét)")}><input value={ev.freshness ?? ""} onChange={(e) => setEv({ ...ev, freshness: e.target.value })} /></Field>
            <Field label={t("評価者（目利き）", "Người thẩm định")} required><input value={ev.evaluator_name ?? ""} onChange={(e) => setEv({ ...ev, evaluator_name: e.target.value })} required /></Field>
            <Field label={t("備考", "Ghi chú")}><input value={ev.note ?? ""} onChange={(e) => setEv({ ...ev, note: e.target.value })} /></Field>
            <div><Btn disabled={a.busy}>{t("評価結果を記録", "Ghi kết quả đánh giá")}</Btn></div>
          </form>
        </RoleGate>
      </Card>

      <Card title={t("このロットの取引", "Giao dịch của lot này")}>
        <Table head={[t("取引番号", "Mã GD"), t("種別", "Loại"), t("買い手", "Bên mua"), t("数量", "SL"), t("単価", "Đơn giá"), t("金額", "Tiền"), t("状態", "Trạng thái"), t("引渡し", "Giao hàng")]} empty={!data.trades.length}>
          {data.trades.map((x: any) => (
            <tr key={x.id}>
              <td className="mono"><Link href={`/trades/${x.id}`}>{x.trade_no}</Link></td>
              <td><Badge group="tradeType" value={x.trade_type} /></td>
              <td>{x.buyer?.code} {x.buyer?.name}</td>
              <td className="num">{qty(x.eff_quantity, l.unit)}</td>
              <td className="num">{yen(x.eff_unit_price)}</td>
              <td className="num">{yen(x.eff_amount)}</td>
              <td><Badge group="tradeStatus" value={x.status} /></td>
              <td><Badge group="deliveryStatus" value={x.delivery_status} /></td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
