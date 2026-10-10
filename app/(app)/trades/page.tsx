"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApi } from "@/lib/api-client";
import { useT, ENUM, useLang } from "@/lib/i18n";
import { PageHeader, Card, Table, Badge, Loading, ErrorBox, Field, LinkBtn, useMe, qty, yen } from "@/components/ui";
import { useLookups } from "@/components/lookups";
import { can } from "@/lib/roles";

export default function Trades() {
  const t = useT();
  const { lang } = useLang();
  const me = useMe();
  const sp = useSearchParams();
  const lk = useLookups();
  const [f, setF] = useState({ date: sp.get("date") ?? "", type: sp.get("type") ?? "", status: "", delivery: "", q: "" });
  const qs = new URLSearchParams(f as any).toString();
  const { data, error } = useApi<any[]>(`/api/trades?${qs}`);
  const opt = (g: string) => Object.entries(ENUM[g]).map(([k, v]) => <option key={k} value={k}>{lang === "ja" ? v[0] : v[1]}</option>);
  const total = (data ?? []).filter((x) => x.status === "CONFIRMED").reduce((s, x) => s + Number(x.eff_amount), 0);
  return (
    <>
      <PageHeader id="T001" ja="取引一覧" vi="Danh sách giao dịch"
        actions={can(me?.roles, "tradeWrite") && <><LinkBtn href="/trades/aitai/new">{t("相対取引入力", "Ghi GD thỏa thuận")}</LinkBtn><LinkBtn href="/trades/seri/new" kind="secondary">{t("せり結果入力", "Nhập kết quả せり")}</LinkBtn></>} />
      <Card>
        <div className="filters">
          <Field label={t("業務日", "Ngày NV")}><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label={t("種別", "Loại")}><select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="">{t("すべて", "Tất cả")}</option>{opt("tradeType")}</select></Field>
          <Field label={t("状態", "Trạng thái")}><select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">{t("すべて", "Tất cả")}</option>{opt("tradeStatus")}</select></Field>
          <Field label={t("引渡し", "Giao hàng")}><select value={f.delivery} onChange={(e) => setF({ ...f, delivery: e.target.value })}><option value="">{t("すべて", "Tất cả")}</option>{opt("deliveryStatus")}</select></Field>
          <Field label={t("取引番号", "Mã GD")}><input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></Field>
        </div>
        <ErrorBox error={error} />
        {!data ? <Loading /> : (
          <>
            <div className="small muted" style={{ marginBottom: 8 }}>{data.length} {t("件", "giao dịch")} · {t("確定金額合計", "Tổng tiền đã chốt")}: <b>{yen(total)}</b></div>
            <Table head={[t("取引番号", "Mã GD"), t("種別", "Loại"), t("業務日", "Ngày NV"), t("ロット", "Lot"), t("品目", "Mặt hàng"), t("買い手", "Bên mua"), t("数量", "SL"), t("単価", "Đơn giá"), t("金額", "Tiền"), t("状態", "Trạng thái"), t("引渡し", "Giao hàng")]} empty={!data.length}>
              {data.map((x) => (
                <tr key={x.id}>
                  <td className="mono nowrap"><Link href={`/trades/${x.id}`}>{x.trade_no}</Link>{x.adjustment_count > 0 && <span className="badge badge-amber" title="adjusted"> Δ</span>}</td>
                  <td><Badge group="tradeType" value={x.trade_type} /></td>
                  <td className="nowrap">{x.biz_date}</td>
                  <td className="mono small">{x.lot?.lot_no}</td>
                  <td>{lk.mname("ITEM", x.lot?.item_code)}</td>
                  <td>{x.buyer?.code} {x.buyer?.name}</td>
                  <td className="num">{qty(x.eff_quantity, x.lot?.unit)}</td>
                  <td className="num">{yen(x.eff_unit_price)}</td>
                  <td className="num">{yen(x.eff_amount)}</td>
                  <td><Badge group="tradeStatus" value={x.status} /></td>
                  <td><Badge group="deliveryStatus" value={x.delivery_status} /></td>
                </tr>
              ))}
            </Table>
          </>
        )}
      </Card>
    </>
  );
}
