"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Field, Btn, useAction, ActionResult, useMe, RoleGate } from "@/components/ui";
import { useLookups } from "@/components/lookups";
import { can } from "@/lib/roles";

export default function NewDispute() {
  const t = useT();
  const me = useMe();
  const sp = useSearchParams();
  const router = useRouter();
  const lk = useLookups();
  const a = useAction();
  const [v, setV] = useState<any>({ biz_date: sp.get("date") ?? me?.today, trade_id: sp.get("trade") ?? "" });
  const set = (k: string) => (e: any) => setV({ ...v, [k]: e.target.value });
  return (
    <>
      <PageHeader id="S004" ja="紛争の登録" vi="Ghi nhận tranh chấp" back="/disputes" />
      <Card>
        <RoleGate ok={can(me?.roles, "disputeWrite")}>
          <ActionResult a={a} />
          <form onSubmit={(e) => { e.preventDefault(); a.run(async () => { const d = await api<any>("/api/disputes", { body: v }); router.push(`/disputes/${d.id}`); }); }}>
            <div className="form-grid">
              <Field label={t("業務日", "Ngày NV")} required><input type="date" value={v.biz_date ?? ""} onChange={set("biz_date")} required /></Field>
              <Field label={t("原因", "Nguyên nhân")} required>
                <select value={v.cause_code ?? ""} onChange={set("cause_code")} required>
                  <option value="" />
                  {lk.masters("DISPUTE_CAUSE").map((m) => <option key={m.code} value={m.code}>{m.label}</option>)}
                </select>
              </Field>
              <Field label={t("担当者", "Người phụ trách")}><input value={v.assignee ?? ""} onChange={set("assignee")} /></Field>
              <Field label={t("処理期限", "Hạn xử lý")}><input type="date" value={v.due_date ?? ""} onChange={set("due_date")} /></Field>
              <div className="full"><Field label={t("内容", "Nội dung")} required><textarea value={v.description ?? ""} onChange={set("description")} required /></Field></div>
            </div>
            {v.trade_id && <p className="small muted">{t("対象取引が紐付けられます。", "Sẽ gắn với giao dịch đã chọn.")}</p>}
            <Btn disabled={a.busy}>{t("登録", "Ghi nhận")}</Btn>
          </form>
        </RoleGate>
      </Card>
    </>
  );
}
