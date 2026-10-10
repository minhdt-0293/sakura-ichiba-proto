"use client";
import Link from "next/link";
import { use, useState } from "react";
import { api, useApi } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Badge, Loading, ErrorBox, Field, Btn, useAction, ActionResult, useMe, KV, qty, yen, dt, RoleGate, Table, Notice } from "@/components/ui";
import { can } from "@/lib/roles";

export default function ReviewCorrection({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const me = useMe();
  const { data, error, reload } = useApi<any>(`/api/corrections/${id}`);
  const a = useAction();
  const [comment, setComment] = useState("");
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  const r = data.request;
  const x = data.trade;
  const newAmount = Math.floor(Number(r.new_quantity) * Number(r.new_unit_price));
  const isMine = r.requester?.id === me?.id;
  const review = (approve: boolean) =>
    a.run(async () => { await api(`/api/corrections/${id}/review`, { body: { approve, comment } }); reload(); }, approve ? t("承認しました（差分レコードを追加）", "Đã duyệt (đã thêm bản ghi delta)") : t("却下しました", "Đã bác"));
  return (
    <>
      <PageHeader id="S008" ja={`訂正申請：${r.req_no}`} vi={`Yêu cầu sửa: ${r.req_no}`} back="/corrections" />
      <Card actions={<Badge group="reqStatus" value={r.status} />} title={t("申請内容", "Nội dung yêu cầu")}>
        <KV items={[
          [t("取引", "Giao dịch"), <Link href={`/trades/${x.id}`} className="mono">{x.trade_no}</Link>],
          [t("業務日", "Ngày NV"), <>{x.biz_date} {data.day_locked && <Badge group="dayStatus" value="LOCKED" />}</>],
          [t("買い手", "Bên mua"), `${x.buyer.code} ${x.buyer.name}`],
          [t("申請者", "Người lập"), r.requester?.display_name],
          [t("申請日時", "Lúc lập"), dt(r.requested_at)],
          [t("理由", "Lý do"), r.reason],
          [t("証跡", "Bằng chứng"), r.evidence_note],
          ...(r.status !== "PENDING" ? [[t("承認者 / 日時", "Người duyệt / lúc"), `${r.reviewer?.display_name ?? ""} / ${dt(r.reviewed_at)}`] as [string, string], [t("コメント", "Nhận xét"), r.review_comment] as [string, string]] : []),
        ]} />
        <div style={{ marginTop: 12 }}>
          <Table head={["", t("数量", "SL"), t("単価", "Đơn giá"), t("金額", "Tiền")]}>
            <tr><td>{t("現在の有効値", "Hiện tại (hiệu lực)")}</td><td className="num">{qty(x.eff_quantity, x.lot.unit)}</td><td className="num">{yen(x.eff_unit_price)}</td><td className="num">{yen(x.eff_amount)}</td></tr>
            <tr><td>{t("申請後", "Sau sửa")}</td><td className="num"><b>{qty(r.new_quantity, x.lot.unit)}</b></td><td className="num"><b>{yen(r.new_unit_price)}</b></td><td className="num"><b>{yen(newAmount)}</b></td></tr>
            {r.status === "PENDING" && <tr><td>Δ</td><td className="num">{qty(Number(r.new_quantity) - Number(x.eff_quantity))}</td><td /><td className="num">{yen(newAmount - Number(x.eff_amount))}</td></tr>}
          </Table>
        </div>
      </Card>
      {r.status === "PENDING" && (
        <Card title={t("承認・却下", "Duyệt / bác")}>
          <RoleGate ok={can(me?.roles, "correctionReview")}>
            {isMine && <Notice tone="warn">{t("申請者本人は承認できません（起票・承認分離）。別の照合担当者でログインしてください。", "Người lập không được tự duyệt (tách lập–duyệt). Hãy đăng nhập bằng người đối soát khác.")}</Notice>}
            <ActionResult a={a} />
            <Field label={t("コメント（却下時は必須）", "Nhận xét (bắt buộc khi bác)")}><textarea value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
            <div className="row">
              <Btn disabled={a.busy} onClick={() => review(true)}>{t("承認する", "Duyệt")}</Btn>
              <Btn kind="danger" disabled={a.busy} onClick={() => review(false)}>{t("却下する", "Bác")}</Btn>
            </div>
          </RoleGate>
        </Card>
      )}
    </>
  );
}
