"use client";
import Link from "next/link";
import { use, useState } from "react";
import { api, useApi } from "@/lib/api-client";
import { useT, useErr, ENUM, useLang } from "@/lib/i18n";
import { PageHeader, Card, Table, Badge, Loading, ErrorBox, Field, Btn, useAction, ActionResult, useMe, yen, qty, RoleGate } from "@/components/ui";
import { PartyForm } from "@/components/party-form";
import { can } from "@/lib/roles";

const REQUIRED: Record<string, string> = { WHOLESALER: "REGISTRATION", INTERMEDIARY: "PERMIT", APPROVED_BUYER: "APPROVAL", MARKET_BUYER: "REGISTRATION" };

export default function PartyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const err = useErr();
  const { lang } = useLang();
  const me = useMe();
  const { data, error, reload } = useApi<any>(`/api/parties/${id}`);
  const a = useAction();
  const q = useAction();
  const [nq, setNq] = useState<any>({});
  const [edit, setEdit] = useState<any>(null);
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  const p = data.party;
  const writable = can(me?.roles, "partyWrite");
  const reqType = REQUIRED[p.kind];

  return (
    <>
      <PageHeader id="P002 / P003" ja={`参加者：${p.code} ${p.name}`} vi={`Người tham gia: ${p.code} ${p.name}`} back="/parties" />
      <div className={"alert " + (data.block_reason ? "alert-error" : "alert-ok")}>
        {data.block_reason
          ? `${t("本日は取引確定できません", "Hôm nay KHÔNG được chốt giao dịch")}: ${err(data.block_reason)}`
          : t("本日は取引確定が可能です（参加資格有効）", "Hôm nay được chốt giao dịch (tư cách hợp lệ)")}
      </div>

      <Card title={<>{t("参加資格", "Tư cách tham gia")} — <Badge group="qualType" value={reqType} /></>}>
        <p className="small muted">
          {t("仲卸は「許可」、売買参加者は「承認」が必要です。両者は別の資格として管理し、取引確定時に個別に判定します。",
             "仲卸 cần 許可 (giấy phép), 売買参加者 cần 承認 (chấp thuận). Hai loại được quản lý tách riêng và kiểm tra tại thời điểm chốt giao dịch.")}
        </p>
        <ActionResult a={q} />
        <Table head={[t("種別", "Loại"), t("番号", "Số"), t("有効開始", "Từ ngày"), t("有効期限", "Đến ngày"), t("状態", "Trạng thái"), t("備考", "Ghi chú"), ""]} empty={!data.qualifications.length}>
          {data.qualifications.map((x: any) => (
            <tr key={x.id}>
              <td><Badge group="qualType" value={x.qual_type} /></td>
              <td>{x.qual_no}</td>
              <td>{x.valid_from}</td>
              <td>{x.valid_to}</td>
              <td><Badge group="qualStatus" value={x.status} /></td>
              <td className="small">{x.note}</td>
              <td>{writable && <Btn kind="ghost" className="btn btn-ghost btn-sm" onClick={() => setEdit({ ...x, reason: "" })}>{t("変更", "Sửa")}</Btn>}</td>
            </tr>
          ))}
        </Table>
        {edit && (
          <form className="card" style={{ marginTop: 12 }} onSubmit={(e) => { e.preventDefault(); q.run(async () => { await api(`/api/qualifications/${edit.id}`, { method: "PUT", body: edit }); setEdit(null); reload(); }, t("更新しました", "Đã cập nhật")); }}>
            <div className="form-grid">
              <Field label={t("状態", "Trạng thái")} required>
                <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                  {Object.entries(ENUM.qualStatus).map(([k, v]) => <option key={k} value={k}>{lang === "ja" ? v[0] : v[1]}</option>)}
                </select>
              </Field>
              <Field label={t("有効期限", "Hết hạn")} required><input type="date" value={edit.valid_to} onChange={(e) => setEdit({ ...edit, valid_to: e.target.value })} /></Field>
              <Field label={t("変更理由", "Lý do thay đổi")} required><input value={edit.reason} onChange={(e) => setEdit({ ...edit, reason: e.target.value })} required /></Field>
              <Field label={t("備考", "Ghi chú")}><input value={edit.note ?? ""} onChange={(e) => setEdit({ ...edit, note: e.target.value })} /></Field>
            </div>
            <div className="row"><Btn disabled={q.busy}>{t("保存", "Lưu")}</Btn><Btn type="button" kind="ghost" onClick={() => setEdit(null)}>{t("キャンセル", "Hủy")}</Btn></div>
          </form>
        )}
        <RoleGate ok={writable}>
          <form className="row" style={{ marginTop: 12, alignItems: "flex-end" }} onSubmit={(e) => { e.preventDefault(); q.run(async () => { await api(`/api/parties/${id}/qualifications`, { body: { ...nq, qual_type: nq.qual_type ?? reqType } }); setNq({}); reload(); }, t("追加しました", "Đã thêm")); }}>
            <Field label={t("資格種別", "Loại tư cách")}>
              <select value={nq.qual_type ?? reqType} onChange={(e) => setNq({ ...nq, qual_type: e.target.value })}>
                {Object.entries(ENUM.qualType).map(([k, v]) => <option key={k} value={k}>{lang === "ja" ? v[0] : v[1]}</option>)}
              </select>
            </Field>
            <Field label={t("番号", "Số")} required><input value={nq.qual_no ?? ""} onChange={(e) => setNq({ ...nq, qual_no: e.target.value })} required /></Field>
            <Field label={t("有効開始", "Từ ngày")} required><input type="date" value={nq.valid_from ?? ""} onChange={(e) => setNq({ ...nq, valid_from: e.target.value })} required /></Field>
            <Field label={t("有効期限", "Đến ngày")} required><input type="date" value={nq.valid_to ?? ""} onChange={(e) => setNq({ ...nq, valid_to: e.target.value })} required /></Field>
            <div className="field"><Btn disabled={q.busy}>{t("資格を追加", "Thêm tư cách")}</Btn></div>
          </form>
        </RoleGate>
      </Card>

      <Card title={t("基本情報", "Thông tin cơ bản")}>
        <ActionResult a={a} />
        {writable ? (
          <PartyForm key={p.updated_at} initial={p} isNew={false} busy={a.busy}
            onSubmit={(v) => a.run(async () => { await api(`/api/parties/${id}`, { method: "PUT", body: v }); reload(); }, t("保存しました", "Đã lưu"))} />
        ) : (
          <RoleGate ok={false}><span /></RoleGate>
        )}
      </Card>

      <Card title={t("直近の取引（20件）", "Giao dịch gần đây (20)")}>
        <Table head={[t("取引番号", "Mã GD"), t("種別", "Loại"), t("業務日", "Ngày NV"), t("ロット", "Lot"), t("数量", "SL"), t("金額", "Tiền"), t("状態", "Trạng thái"), t("引渡し", "Giao hàng")]} empty={!data.trades.length}>
          {data.trades.map((x: any) => (
            <tr key={x.id}>
              <td className="mono"><Link href={`/trades/${x.id}`}>{x.trade_no}</Link></td>
              <td><Badge group="tradeType" value={x.trade_type} /></td>
              <td>{x.biz_date}</td>
              <td className="mono">{x.lots?.lot_no}</td>
              <td className="num">{qty(x.eff_quantity, x.lots?.unit)}</td>
              <td className="num">{yen(x.eff_amount)}</td>
              <td><Badge group="tradeStatus" value={x.status} /></td>
              <td><Badge group="deliveryStatus" value={x.delivery_status} /></td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
