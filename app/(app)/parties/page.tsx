"use client";
import Link from "next/link";
import { useState } from "react";
import { useApi } from "@/lib/api-client";
import { useT, ENUM, useLang } from "@/lib/i18n";
import { PageHeader, Card, Table, Badge, Loading, ErrorBox, Field, LinkBtn, useMe, yen } from "@/components/ui";
import { can } from "@/lib/roles";

export default function Parties() {
  const t = useT();
  const { lang } = useLang();
  const me = useMe();
  const [kind, setKind] = useState("");
  const [q, setQ] = useState("");
  const { data, error } = useApi<any[]>(`/api/parties?kind=${kind}&q=${encodeURIComponent(q)}`);
  return (
    <>
      <PageHeader id="P001" ja="参加者一覧" vi="Danh sách người tham gia"
        actions={can(me?.roles, "partyWrite") && <LinkBtn href="/parties/new">{t("参加者を登録", "Thêm người tham gia")}</LinkBtn>} />
      <Card>
        <div className="filters">
          <Field label={t("種別", "Loại")}>
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">{t("すべて", "Tất cả")}</option>
              {Object.entries(ENUM.partyKind).map(([k, v]) => <option key={k} value={k}>{lang === "ja" ? v[0] : v[1]}</option>)}
            </select>
          </Field>
          <Field label={t("コード／名称", "Mã / tên")}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="N-101" />
          </Field>
        </div>
        <ErrorBox error={error} />
        {!data ? <Loading /> : (
          <Table head={[t("コード", "Mã"), t("名称", "Tên"), t("種別", "Loại"), t("参加資格", "Tư cách"), t("有効期限", "Hết hạn"), t("状態", "Trạng thái"), t("取引可否（本日）", "Được giao dịch (hôm nay)"), t("参加上限", "Hạn mức")]} empty={!data.length}>
            {data.map((p) => (
              <tr key={p.id}>
                <td className="mono"><Link href={`/parties/${p.id}`}>{p.code}</Link></td>
                <td>{p.name}</td>
                <td><Badge group="partyKind" value={p.kind} tone="navy" /></td>
                <td>{p.current_qual && <><Badge group="qualType" value={p.current_qual.qual_type} /> <span className="small">{p.current_qual.qual_no}</span></>}</td>
                <td className="nowrap">{p.current_qual?.valid_to}</td>
                <td><Badge group="partyStatus" value={p.status} /></td>
                <td>{p.can_trade ? <span className="badge badge-green">○ {t("可", "Được")}</span> : <span className="badge badge-red">× {t("不可", "Không")}</span>}</td>
                <td className="num">{p.participation_limit ? yen(p.participation_limit) : "-"}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
