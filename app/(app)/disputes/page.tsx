"use client";
import Link from "next/link";
import { useState } from "react";
import { useApi } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Table, Badge, Loading, ErrorBox, LinkBtn, useMe } from "@/components/ui";
import { useLookups } from "@/components/lookups";
import { can } from "@/lib/roles";

const TABS = [["OPEN_ALL", "未解決", "Chưa giải quyết"], ["RESOLVED", "解決済", "Đã giải quyết"], ["", "すべて", "Tất cả"]];

export default function Disputes() {
  const t = useT();
  const me = useMe();
  const lk = useLookups();
  const [st, setSt] = useState("OPEN_ALL");
  const { data, error } = useApi<any[]>(`/api/disputes?status=${st}`);
  return (
    <>
      <PageHeader id="S003" ja="紛争一覧" vi="Danh sách tranh chấp" actions={can(me?.roles, "disputeWrite") && <LinkBtn href="/disputes/new">{t("紛争を登録", "Ghi tranh chấp")}</LinkBtn>} />
      <div className="tabs">{TABS.map(([k, ja, vi]) => <button key={k} className={st === k ? "on" : ""} onClick={() => setSt(k)}>{t(ja, vi)}</button>)}</div>
      <Card>
        <ErrorBox error={error} />
        {!data ? <Loading /> : (
          <Table head={[t("紛争番号", "Số"), t("業務日", "Ngày NV"), t("取引", "GD"), t("原因", "Nguyên nhân"), t("内容", "Nội dung"), t("担当", "Phụ trách"), t("期限", "Hạn"), t("状態", "Trạng thái")]} empty={!data.length}>
            {data.map((d) => (
              <tr key={d.id}>
                <td className="mono"><Link href={`/disputes/${d.id}`}>{d.dispute_no}</Link></td>
                <td>{d.biz_date}</td>
                <td className="mono">{d.trade ? <Link href={`/trades/${d.trade.id}`}>{d.trade.trade_no}</Link> : "-"}</td>
                <td>{lk.mname("DISPUTE_CAUSE", d.cause_code)}</td>
                <td className="small">{d.description}</td>
                <td className="small">{d.assignee}</td>
                <td className="nowrap">{d.due_date} {d.overdue && <span className="badge badge-red">{t("期限超過", "Quá hạn")}</span>}</td>
                <td><Badge group="disputeStatus" value={d.status} /></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
