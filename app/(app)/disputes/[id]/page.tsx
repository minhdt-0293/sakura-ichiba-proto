"use client";
import Link from "next/link";
import { use, useState } from "react";
import { api, useApi } from "@/lib/api-client";
import { useT, ENUM, useLang } from "@/lib/i18n";
import { PageHeader, Card, Table, Badge, Loading, ErrorBox, Field, Btn, useAction, ActionResult, useMe, KV, dt, RoleGate } from "@/components/ui";
import { useLookups } from "@/components/lookups";
import { can } from "@/lib/roles";

export default function DisputeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const { lang } = useLang();
  const me = useMe();
  const lk = useLookups();
  const { data, error, reload } = useApi<any>(`/api/disputes/${id}`);
  const a = useAction();
  const [v, setV] = useState<any>(null);
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  const d = data.dispute;
  const form = v ?? { status: d.status, assignee: d.assignee ?? "", due_date: d.due_date ?? "", resolution: d.resolution ?? "", note: "" };
  const set = (k: string) => (e: any) => setV({ ...form, [k]: e.target.value });
  return (
    <>
      <PageHeader id="S004" ja={`紛争詳細：${d.dispute_no}`} vi={`Chi tiết tranh chấp: ${d.dispute_no}`} back="/disputes" />
      <Card title={t("内容", "Nội dung")} actions={<Badge group="disputeStatus" value={d.status} />}>
        <KV items={[
          [t("業務日", "Ngày NV"), d.biz_date],
          [t("取引", "Giao dịch"), d.trade ? <Link href={`/trades/${d.trade.id}`} className="mono">{d.trade.trade_no}</Link> : "-"],
          [t("原因", "Nguyên nhân"), lk.mname("DISPUTE_CAUSE", d.cause_code)],
          [t("担当", "Phụ trách"), d.assignee],
          [t("期限", "Hạn"), d.due_date],
          [t("内容", "Nội dung"), d.description],
          [t("最終結果", "Kết quả cuối"), d.resolution],
        ]} />
      </Card>
      {d.status !== "RESOLVED" && (
        <Card title={t("対応状況の更新", "Cập nhật xử lý")}>
          <RoleGate ok={can(me?.roles, "disputeWrite")}>
            <ActionResult a={a} />
            <form onSubmit={(e) => { e.preventDefault(); a.run(async () => { await api(`/api/disputes/${id}`, { method: "PUT", body: form }); setV(null); reload(); }, t("更新しました", "Đã cập nhật")); }}>
              <div className="form-grid">
                <Field label={t("状態", "Trạng thái")} required>
                  <select value={form.status} onChange={set("status")}>
                    {Object.entries(ENUM.disputeStatus).map(([k, p]) => <option key={k} value={k}>{lang === "ja" ? p[0] : p[1]}</option>)}
                  </select>
                </Field>
                <Field label={t("担当", "Phụ trách")}><input value={form.assignee} onChange={set("assignee")} /></Field>
                <Field label={t("期限", "Hạn")}><input type="date" value={form.due_date} onChange={set("due_date")} /></Field>
                <Field label={t("最終結果（解決時必須）", "Kết quả (bắt buộc khi giải quyết)")} required={form.status === "RESOLVED"}><input value={form.resolution} onChange={set("resolution")} required={form.status === "RESOLVED"} /></Field>
                <div className="full"><Field label={t("対応メモ", "Ghi chú xử lý")} required><textarea value={form.note} onChange={set("note")} required /></Field></div>
              </div>
              <Btn disabled={a.busy}>{t("更新", "Cập nhật")}</Btn>
            </form>
          </RoleGate>
        </Card>
      )}
      <Card title={t("更新履歴", "Lịch sử cập nhật")}>
        <Table head={[t("日時", "Thời điểm"), t("状態", "Trạng thái"), t("メモ", "Ghi chú"), t("更新者", "Người cập nhật")]}>
          {data.updates.map((u: any) => (
            <tr key={u.id}><td className="small nowrap">{dt(u.updated_at)}</td><td><Badge group="disputeStatus" value={u.status} /></td><td className="small">{u.note}</td><td className="small">{u.by?.display_name}</td></tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
