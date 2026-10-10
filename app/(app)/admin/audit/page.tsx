"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApi } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Loading, ErrorBox, Field } from "@/components/ui";
import { AuditTable } from "@/components/audit-table";

const ENTITIES = ["", "trades", "lots", "parties", "qualifications", "business_days", "rate_versions", "incentive_runs", "app_users", "disputes", "notifications", "api"];

export default function Audit() {
  const t = useT();
  const sp = useSearchParams();
  const [f, setF] = useState({ entity: "", action: "", actor: "", result: sp.get("result") ?? "", entity_id: "", from: "", to: "" });
  const { data, error } = useApi<any>(`/api/audit?${new URLSearchParams(f as any)}`);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  return (
    <>
      <PageHeader id="A003" ja="操作ログ検索" vi="Tra cứu nhật ký thao tác" />
      <p className="small muted">{t("作成・変更・承認・締め・権限変更などの業務操作を、実施者・日時・変更前後・理由とともに記録します。ブロックされた操作も記録されます（FR-AUDIT-01/02）。",
        "Ghi lại thao tác nghiệp vụ (tạo, sửa, duyệt, khóa, đổi quyền) kèm người thực hiện, thời điểm, trước/sau, lý do. Thao tác bị chặn cũng được ghi (FR-AUDIT-01/02).")}</p>
      <Card>
        <div className="filters">
          <Field label={t("対象", "Đối tượng")}><select value={f.entity} onChange={set("entity")}>{ENTITIES.map((x) => <option key={x} value={x}>{x || t("すべて", "Tất cả")}</option>)}</select></Field>
          <Field label={t("操作", "Thao tác")}><input value={f.action} onChange={set("action")} placeholder="TRADE" /></Field>
          <Field label={t("対象ID", "ID đối tượng")}><input value={f.entity_id} onChange={set("entity_id")} /></Field>
          <Field label={t("実施者", "Người thực hiện")}>
            <select value={f.actor} onChange={set("actor")}><option value="">{t("すべて", "Tất cả")}</option>{(data?.users ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.display_name}</option>)}</select>
          </Field>
          <Field label={t("結果", "Kết quả")}><select value={f.result} onChange={set("result")}><option value="">{t("すべて", "Tất cả")}</option><option value="OK">OK</option><option value="BLOCKED">BLOCKED</option></select></Field>
          <Field label={t("開始日", "Từ ngày")}><input type="date" value={f.from} onChange={set("from")} /></Field>
          <Field label={t("終了日", "Đến ngày")}><input type="date" value={f.to} onChange={set("to")} /></Field>
        </div>
        <ErrorBox error={error} />
        {!data ? <Loading /> : <><div className="small muted">{data.rows.length} {t("件（最大300）", "dòng (tối đa 300)")}</div><AuditTable rows={data.rows} /></>}
      </Card>
    </>
  );
}
