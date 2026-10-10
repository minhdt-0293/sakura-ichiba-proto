"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApi } from "@/lib/api-client";
import { useT, ENUM, useLang } from "@/lib/i18n";
import { PageHeader, Card, Table, Badge, Loading, ErrorBox, Field, LinkBtn, useMe, qty } from "@/components/ui";
import { useLookups } from "@/components/lookups";
import { can } from "@/lib/roles";

export default function Lots() {
  const t = useT();
  const { lang } = useLang();
  const me = useMe();
  const sp = useSearchParams();
  const lk = useLookups();
  const [date, setDate] = useState(sp.get("date") ?? me?.today ?? "");
  const [status, setStatus] = useState("");
  const { data, error } = useApi<any[]>(`/api/lots?date=${date}&status=${status}`);
  return (
    <>
      <PageHeader id="L001" ja="ロット一覧" vi="Danh sách lot" actions={can(me?.roles, "lotCreate") && <LinkBtn href="/lots/new">{t("ロット受付", "Tiếp nhận lot")}</LinkBtn>} />
      <Card>
        <div className="filters">
          <Field label={t("業務日", "Ngày nghiệp vụ")}><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label={t("状態", "Trạng thái")}>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">{t("すべて", "Tất cả")}</option>
              {Object.entries(ENUM.lotStatus).map(([k, v]) => <option key={k} value={k}>{lang === "ja" ? v[0] : v[1]}</option>)}
            </select>
          </Field>
        </div>
        <ErrorBox error={error} />
        {!data ? <Loading /> : (
          <Table head={[t("ロット番号", "Mã lot"), t("仮番号", "Mã tạm"), t("業務日", "Ngày NV"), t("卸売業者", "Bán buôn"), t("品目", "Mặt hàng"), t("産地", "Xuất xứ"), t("入荷数量", "SL nhập"), t("販売可能", "Còn bán"), t("評価", "Đánh giá"), t("状態", "Trạng thái")]} empty={!data.length}>
            {data.map((l) => (
              <tr key={l.id}>
                <td className="mono"><Link href={`/lots/${l.id}`}>{l.lot_no}</Link></td>
                <td className="small">{l.temp_no}</td>
                <td>{l.biz_date}</td>
                <td>{l.wholesaler?.name}</td>
                <td>{lk.mname("ITEM", l.item_code)}</td>
                <td>{l.origin}</td>
                <td className="num">{qty(l.quantity_initial, l.unit)}</td>
                <td className="num">{qty(l.quantity_available, l.unit)}</td>
                <td>{l.lot_evaluations?.[0] ? lk.mname("GRADE", l.lot_evaluations[0].grade) : "-"}</td>
                <td><Badge group="lotStatus" value={l.status} /></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
