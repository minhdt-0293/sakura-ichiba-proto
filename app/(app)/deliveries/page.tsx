"use client";
import Link from "next/link";
import { useState } from "react";
import { useApi } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Table, Badge, Loading, ErrorBox, useMe, qty, LinkBtn } from "@/components/ui";
import { useLookups } from "@/components/lookups";
import { can } from "@/lib/roles";

const TABS = [
  { k: "PENDING,PARTIAL,EXCEPTION", ja: "未完了（滞留・例外）", vi: "Chưa xong (tồn / ngoại lệ)" },
  { k: "EXCEPTION", ja: "例外のみ", vi: "Chỉ ngoại lệ" },
  { k: "COMPLETED", ja: "完了", vi: "Đã xong" },
  { k: "ALL", ja: "すべて", vi: "Tất cả" },
];

export default function Deliveries() {
  const t = useT();
  const me = useMe();
  const lk = useLookups();
  const [tab, setTab] = useState(TABS[0].k);
  const { data, error } = useApi<any[]>(`/api/deliveries?status=${tab}`);
  return (
    <>
      <PageHeader id="D001" ja="引渡し一覧" vi="Danh sách giao hàng" />
      <div className="tabs">
        {TABS.map((x) => <button key={x.k} className={tab === x.k ? "on" : ""} onClick={() => setTab(x.k)}>{t(x.ja, x.vi)}</button>)}
      </div>
      <Card>
        <ErrorBox error={error} />
        {!data ? <Loading /> : (
          <Table head={[t("取引番号", "Mã GD"), t("業務日", "Ngày NV"), t("品目", "Mặt hàng"), t("買い手", "Bên mua"), t("取引数量", "SL GD"), t("引渡し済", "Đã giao"), t("残", "Còn"), t("状態", "Trạng thái"), ""]} empty={!data.length}>
            {data.map((x) => {
              const late = x.delivery_status !== "COMPLETED" && x.biz_date < (me?.today ?? "");
              return (
                <tr key={x.id}>
                  <td className="mono"><Link href={`/trades/${x.id}`}>{x.trade_no}</Link></td>
                  <td className="nowrap">{x.biz_date} {late && <span className="badge badge-red">{t("滞留", "Tồn")}</span>}</td>
                  <td>{lk.mname("ITEM", x.lot?.item_code)}</td>
                  <td>{x.buyer?.code} {x.buyer?.name}</td>
                  <td className="num">{qty(x.eff_quantity, x.lot?.unit)}</td>
                  <td className="num">{qty(x.delivered_qty, x.lot?.unit)}</td>
                  <td className="num">{qty(Math.max(0, Number(x.eff_quantity) - Number(x.delivered_qty)), x.lot?.unit)}</td>
                  <td><Badge group="deliveryStatus" value={x.delivery_status} /></td>
                  <td>{can(me?.roles, "deliveryWrite") && x.delivery_status !== "COMPLETED" && <LinkBtn href={`/deliveries/${x.id}`} kind="secondary">{t("記録", "Ghi")}</LinkBtn>}</td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </>
  );
}
