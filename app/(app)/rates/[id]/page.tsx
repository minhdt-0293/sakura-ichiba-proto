"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { api, useApi } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Badge, Loading, ErrorBox, Field, Btn, useAction, ActionResult, useMe, KV, dt, yen, RoleGate, Notice, Table } from "@/components/ui";
import { TierEditor, toPayload, fromRows, Tier } from "@/components/tier-editor";
import { AuditTable } from "@/components/audit-table";
import { can } from "@/lib/roles";

export default function RateDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const me = useMe();
  const router = useRouter();
  const { data, error, reload } = useApi<any>(`/api/rates/${id}`);
  const a = useAction();
  const [edit, setEdit] = useState<{ eff: string; note: string; tiers: Tier[] } | null>(null);
  const [comment, setComment] = useState("");
  const [rbDate, setRbDate] = useState("");
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  const v = data.version;
  const isDraft = v.status === "DRAFT";
  const mine = v.creator?.id === me?.id;
  return (
    <>
      <PageHeader id="R002" ja={`料率版 v${v.version_no}`} vi={`Version tỷ lệ v${v.version_no}`} back="/rates" />
      <ActionResult a={a} />
      <Card title={t("版の内容", "Nội dung version")} actions={<Badge group="rateStatus" value={v.status} />}>
        <KV items={[
          [t("発効日", "Hiệu lực từ"), v.effective_from],
          [t("起票者", "Người lập"), v.creator?.display_name],
          [t("承認者", "Người duyệt"), v.approver?.display_name],
          [t("承認日時", "Lúc duyệt"), dt(v.approved_at)],
          [t("備考", "Ghi chú"), v.note],
          [t("承認コメント", "Nhận xét duyệt"), v.review_comment],
        ]} />
        {!edit && (
          <div style={{ marginTop: 12 }}>
            <Table head={[t("対象金額（以上）", "Số tiền từ"), t("料率", "Tỷ lệ")]}>
              {v.rate_tiers.map((x: any) => <tr key={x.min_amount}><td className="num">{yen(x.min_amount)}</td><td className="num">{(Number(x.rate) * 100).toFixed(2)}%</td></tr>)}
            </Table>
          </div>
        )}
        {isDraft && can(me?.roles, "rateDraft") && !edit && (
          <Btn kind="secondary" style={{ marginTop: 12 }} onClick={() => setEdit({ eff: v.effective_from, note: v.note ?? "", tiers: fromRows(v.rate_tiers) })}>{t("下書きを編集", "Sửa bản nháp")}</Btn>
        )}
        {edit && (
          <form style={{ marginTop: 12 }} onSubmit={(e) => { e.preventDefault(); a.run(async () => { await api(`/api/rates/${id}`, { method: "PUT", body: { effective_from: edit.eff, note: edit.note, tiers: toPayload(edit.tiers) } }); setEdit(null); reload(); }, t("保存しました", "Đã lưu")); }}>
            <div className="form-grid">
              <Field label={t("発効日", "Ngày hiệu lực")} required><input type="date" value={edit.eff} onChange={(e) => setEdit({ ...edit, eff: e.target.value })} required /></Field>
              <Field label={t("備考", "Ghi chú")}><input value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} /></Field>
            </div>
            <TierEditor tiers={edit.tiers} onChange={(tiers) => setEdit({ ...edit, tiers })} />
            <div className="row" style={{ marginTop: 8 }}><Btn disabled={a.busy}>{t("保存", "Lưu")}</Btn><Btn type="button" kind="ghost" onClick={() => setEdit(null)}>{t("キャンセル", "Hủy")}</Btn></div>
          </form>
        )}
      </Card>
      {isDraft && (
        <Card title={t("承認・却下", "Duyệt / bác")}>
          <RoleGate ok={can(me?.roles, "rateReview")}>
            {mine && <Notice tone="warn">{t("起票者本人は承認できません（起票・承認分離）。", "Người lập không được tự duyệt (tách lập–duyệt).")}</Notice>}
            <Field label={t("コメント（却下時は必須）", "Nhận xét (bắt buộc khi bác)")}><textarea value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
            <div className="row">
              <Btn disabled={a.busy} onClick={() => a.run(async () => { await api(`/api/rates/${id}/review`, { body: { approve: true, comment } }); reload(); }, t("承認しました", "Đã duyệt"))}>{t("承認", "Duyệt")}</Btn>
              <Btn kind="danger" disabled={a.busy} onClick={() => a.run(async () => { await api(`/api/rates/${id}/review`, { body: { approve: false, comment } }); reload(); }, t("却下しました", "Đã bác"))}>{t("却下", "Bác")}</Btn>
            </div>
          </RoleGate>
        </Card>
      )}
      {v.status === "APPROVED" && can(me?.roles, "rateDraft") && (
        <Card title={t("この版に戻す（ロールバック）", "Quay lại version này (rollback)")}>
          <p className="small muted">{t("ロールバックは、この版と同じ内容の新しい下書きを作成します。承認後、指定日から適用されます。過去の計算結果は再計算しません（前提 Q-20）。",
            "Rollback tạo bản nháp mới có nội dung giống version này; sau khi được duyệt sẽ áp dụng từ ngày chỉ định. Không tính lại các kỳ đã chốt (giả định Q-20).")}</p>
          <form className="row" onSubmit={(e) => { e.preventDefault(); a.run(async () => { const r = await api<any>(`/api/rates/${id}/rollback`, { body: { effective_from: rbDate } }); router.push(`/rates/${r.id}`); }); }}>
            <Field label={t("発効日", "Ngày hiệu lực")} required><input type="date" min={me?.today} value={rbDate} onChange={(e) => setRbDate(e.target.value)} required /></Field>
            <Btn kind="secondary" disabled={a.busy}>{t("ロールバック用の下書きを作成", "Tạo bản nháp rollback")}</Btn>
          </form>
        </Card>
      )}
      <Card title={t("監査ログ", "Audit log")}><AuditTable rows={data.audit} /></Card>
    </>
  );
}
