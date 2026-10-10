"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApi } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Table, Loading, ErrorBox, Field, useMe, yen, Badge, RoleGate, MockNote } from "@/components/ui";
import { can } from "@/lib/roles";

export default function Export() {
  const t = useT();
  const me = useMe();
  const sp = useSearchParams();
  const [date, setDate] = useState(sp.get("date") ?? "");
  const { data, error } = useApi<any>(date ? `/api/export/accounting?date=${date}` : null);
  const total = (data?.rows ?? []).reduce((s: number, r: any) => s + r.amount, 0);
  return (
    <>
      <PageHeader id="B003" ja="会計データ出力" vi="Xuất dữ liệu cho kế toán" />
      <RoleGate ok={can(me?.roles, "accountingExport")}>
        <MockNote ja="会計システムとの連携方式は未確定（08-03）。基本範囲は締め後に画面からCSVを出力し、会計担当が手動で取り込む前提です（Q-09）。税額は仮に10%で計算しています（税率は要確認 Q-06）。"
          vi="Phương thức liên kết kế toán chưa chốt (08-03). Baseline giả định xuất CSV từ màn hình sau khi khóa ngày, kế toán nhập tay (Q-09). Thuế tạm tính 10% (cần xác nhận thuế suất, Q-06)." />
        <Card>
          <div className="filters">
            <Field label={t("業務日（締め済のみ出力可）", "Ngày NV (chỉ xuất ngày đã khóa)")}><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            {data && <div className="field"><span className="field-label">{t("状態", "Trạng thái")}</span><Badge group="dayStatus" value={data.locked ? "LOCKED" : "OPEN"} /></div>}
            {data?.locked && <a className="btn btn-primary" href={`/api/export/accounting?date=${date}&format=csv`}>{t("CSVを出力", "Xuất CSV")} ⬇</a>}
          </div>
          {data && !data.locked && <div className="alert alert-warn">{t("締め前の業務日は出力できません（プレビューのみ）。", "Ngày chưa khóa thì chỉ xem trước, không xuất được.")}</div>}
          <ErrorBox error={error} />
          {date && !data && !error && <Loading />}
          {data && (
            <>
              <div className="small muted" style={{ marginBottom: 8 }}>{data.rows.length} {t("行", "dòng")} · {t("合計", "Tổng")} {yen(total)}</div>
              <Table head={["batch_code", t("業務日", "Ngày NV"), t("参加者コード", "Mã"), t("参加者名", "Tên"), t("金額（税抜）", "Tiền (chưa thuế)"), t("消費税", "Thuế"), t("行状態", "Trạng thái dòng")]} empty={!data.rows.length}>
                {data.rows.map((r: any, i: number) => (
                  <tr key={i}><td className="mono small">{r.batch_code}</td><td>{r.biz_date}</td><td className="mono">{r.party_code}</td><td>{r.party_name}</td><td className="num">{yen(r.amount)}</td><td className="num">{yen(r.tax)}</td><td><Badge value={r.row_status} tone={r.row_status === "ADJUSTED" ? "amber" : "green"} /></td></tr>
                ))}
              </Table>
            </>
          )}
        </Card>
      </RoleGate>
    </>
  );
}
