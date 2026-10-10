"use client";
import { use, useState } from "react";
import { useApi } from "@/lib/api-client";
import { useT, useLang } from "@/lib/i18n";
import { PageHeader, Card, Table, Loading, ErrorBox, Field, useMe } from "@/components/ui";

const fmt = (v: unknown, num?: boolean) => (v == null ? "" : num && typeof v === "number" ? v.toLocaleString("ja-JP") : num ? Number(v).toLocaleString("ja-JP") : String(v));

export default function ReportView({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const t = useT();
  const { lang } = useLang();
  const me = useMe();
  const [date, setDate] = useState(me?.today ?? "");
  const [period, setPeriod] = useState((me?.today ?? "").slice(0, 7));
  const qs = `date=${date}&period=${period}`;
  const { data, error } = useApi<any>(`/api/reports/${code}?${qs}`);
  const meta = data?.meta;
  return (
    <>
      <PageHeader id="B002" ja={meta ? `${code} ${meta.ja}` : code} vi={meta ? `${code} ${meta.vi}` : code} back="/reports"
        actions={<a className="btn btn-secondary" href={`/api/reports/${code}?${qs}&format=csv&lang=${lang}`}>CSV ⬇</a>} />
      <Card>
        {meta?.param === "date" && <div className="filters"><Field label={t("業務日", "Ngày NV")}><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field></div>}
        {meta?.param === "period" && <div className="filters"><Field label={t("月", "Tháng")}><input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} /></Field></div>}
        <ErrorBox error={error} />
        {!data ? <Loading /> : (
          <>
            <div className="small muted" style={{ marginBottom: 8 }}>{data.rows.length} {t("行", "dòng")}</div>
            <Table head={meta.cols.map((c: any) => (lang === "ja" ? c.ja : c.vi))} empty={!data.rows.length}>
              {data.rows.map((r: any, i: number) => (
                <tr key={i}>{meta.cols.map((c: any) => <td key={c.key} className={c.num ? "num" : ""}>{fmt(r[c.key], c.num)}</td>)}</tr>
              ))}
            </Table>
          </>
        )}
      </Card>
    </>
  );
}
