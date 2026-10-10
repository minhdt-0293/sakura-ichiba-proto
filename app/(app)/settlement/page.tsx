"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, useApi } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Table, Badge, Loading, ErrorBox, Field, Btn, useAction, ActionResult, useMe, Stat, qty, yen, dt, RoleGate, LinkBtn } from "@/components/ui";
import { can } from "@/lib/roles";

export default function Settlement() {
  const t = useT();
  const me = useMe();
  const sp = useSearchParams();
  const [date, setDate] = useState(sp.get("date") ?? me?.today ?? "");
  const { data, error, reload } = useApi<any>(`/api/settlement?date=${date}`);
  const a = useAction();
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);
  const s = data?.summary;
  const locked = s?.status === "LOCKED";
  const warnings = s
    ? [
        s.delivery_pending > 0 && t(`未完了の引渡しが ${s.delivery_pending} 件あります`, `Còn ${s.delivery_pending} giao dịch chưa giao xong`),
        s.delivery_exception > 0 && t(`引渡し例外が ${s.delivery_exception} 件あります`, `Có ${s.delivery_exception} ngoại lệ giao hàng`),
        s.open_disputes > 0 && t(`未解決の紛争が ${s.open_disputes} 件あります`, `Có ${s.open_disputes} tranh chấp chưa giải quyết`),
      ].filter(Boolean)
    : [];
  return (
    <>
      <PageHeader id="S001 / S002" ja="日次照合・締め" vi="Đối soát ngày & khóa ngày"
        actions={locked && can(me?.roles, "accountingExport") && <LinkBtn href={`/export?date=${date}`} kind="secondary">{t("会計データ出力へ", "Tới xuất dữ liệu kế toán")}</LinkBtn>} />
      <Card>
        <div className="filters">
          <Field label={t("業務日", "Ngày nghiệp vụ")}><input type="date" value={date} onChange={(e) => { setDate(e.target.value); setConfirm(false); }} /></Field>
          {s && <div className="field"><span className="field-label">{t("状態", "Trạng thái")}</span><Badge group="dayStatus" value={s.status} /></div>}
          {locked && <div className="field small muted">{t("締め", "Khóa")}: {s.locked_by} / {dt(s.locked_at)}</div>}
        </div>
      </Card>
      <ErrorBox error={error} />
      {!data ? <Loading /> : (
        <>
          <div className="stats" style={{ marginTop: 16 }}>
            <Stat label={t("相対取引 件数 / 金額", "相対: số GD / tiền")} value={<>{s.aitai_count} <small className="small">/ {yen(s.aitai_amount)}</small></>} />
            <Stat label={t("せり 件数 / 金額", "せり: số GD / tiền")} value={<>{s.seri_count} <small className="small">/ {yen(s.seri_amount)}</small></>} />
            <Stat label={t("取消件数", "Số GD đã hủy")} value={s.cancelled_count} />
            <Stat label={t("未完了の引渡し", "Giao hàng chưa xong")} value={s.delivery_pending} tone={s.delivery_pending ? "amber" : undefined} />
            <Stat label={t("引渡し例外", "Ngoại lệ giao hàng")} value={s.delivery_exception} tone={s.delivery_exception ? "red" : undefined} />
            <Stat label={t("未解決の紛争", "Tranh chấp mở")} value={s.open_disputes} tone={s.open_disputes ? "red" : undefined} />
            <Stat label={t("この日に計上された訂正", "Điều chỉnh ghi nhận trong ngày")} value={s.adjustments_in_day} />
          </div>
          <ActionResult a={a} />
          <Card title={t("業務日の締め（ロック）", "Khóa ngày nghiệp vụ")}>
            {locked ? (
              <p>{t("この業務日は締め済です。以降の変更は承認付きの訂正（差分レコード）のみで、計上日は訂正承認日の業務日になります。締め解除の機能はありません（前提 Q-07）。",
                "Ngày này đã khóa. Mọi thay đổi sau đó chỉ qua yêu cầu sửa có duyệt (bản ghi delta), ghi nhận vào ngày nghiệp vụ lúc duyệt. Không có chức năng mở khóa (giả định Q-07).")}</p>
            ) : (
              <RoleGate ok={can(me?.roles, "settlement")}>
                {warnings.length > 0 && (
                  <div className="alert alert-warn">
                    {warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
                    <div className="small">{t("警告があっても締めは可能です。内容を確認してください。", "Vẫn có thể khóa khi còn cảnh báo, hãy kiểm tra kỹ.")}</div>
                  </div>
                )}
                {!confirm ? (
                  <Btn onClick={() => setConfirm(true)} disabled={!date || date > (me?.today ?? "")}>{t("この業務日を締める", "Khóa ngày nghiệp vụ này")}</Btn>
                ) : (
                  <form className="row" onSubmit={(e) => { e.preventDefault(); a.run(async () => { await api("/api/settlement/lock", { body: { date, note } }); setConfirm(false); reload(); }, t("締めました", "Đã khóa ngày")); }}>
                    <Field label={t("確認メモ", "Ghi chú xác nhận")}><input value={note} onChange={(e) => setNote(e.target.value)} style={{ minWidth: 300 }} /></Field>
                    <Btn kind="danger" disabled={a.busy}>{t(`${date} を締める（取消不可）`, `Khóa ${date} (không mở lại được)`)}</Btn>
                    <Btn type="button" kind="ghost" onClick={() => setConfirm(false)}>{t("キャンセル", "Hủy")}</Btn>
                  </form>
                )}
              </RoleGate>
            )}
          </Card>
          <Card title={t("照合明細", "Chi tiết dòng đối soát")}>
            <Table head={[t("取引番号", "Mã GD"), t("種別", "Loại"), t("買い手", "Bên mua"), t("数量", "SL"), t("単価", "Đơn giá"), t("金額", "Tiền"), t("状態", "Trạng thái"), t("引渡し", "Giao hàng"), t("訂正", "Đã sửa")]} empty={!data.lines.length}>
              {data.lines.map((x: any) => (
                <tr key={x.id}>
                  <td className="mono"><Link href={`/trades/${x.id}`}>{x.trade_no}</Link></td>
                  <td><Badge group="tradeType" value={x.trade_type} /></td>
                  <td>{x.buyer?.code} {x.buyer?.name}</td>
                  <td className="num">{qty(x.eff_quantity, x.lot?.unit)}</td>
                  <td className="num">{yen(x.eff_unit_price)}</td>
                  <td className="num">{x.status === "CONFIRMED" ? yen(x.eff_amount) : "-"}</td>
                  <td><Badge group="tradeStatus" value={x.status} /></td>
                  <td><Badge group="deliveryStatus" value={x.delivery_status} /></td>
                  <td>{x.adjustment_count > 0 ? "Δ" : ""}</td>
                </tr>
              ))}
            </Table>
          </Card>
          {data.adjustments.length > 0 && (
            <Card title={t("この業務日に計上された訂正（差分）", "Điều chỉnh (delta) ghi nhận vào ngày này")}>
              <Table head={[t("取引", "GD"), t("元の業務日", "Ngày gốc"), t("申請", "YC"), t("数量差分", "Delta SL"), t("金額差分", "Delta tiền"), t("理由", "Lý do")]}>
                {data.adjustments.map((d: any) => (
                  <tr key={d.id}>
                    <td className="mono">{d.trade?.trade_no}</td><td>{d.trade?.biz_date}</td><td className="mono">{d.correction?.req_no}</td>
                    <td className="num">{qty(d.delta_quantity)}</td><td className="num">{yen(d.delta_amount)}</td><td className="small">{d.correction?.reason}</td>
                  </tr>
                ))}
              </Table>
            </Card>
          )}
          <Card title={t("直近の締め履歴", "Lịch sử khóa gần đây")}>
            <div className="flow">
              {data.days.map((d: any) => (
                <a key={d.biz_date} href="#" onClick={(e) => { e.preventDefault(); setDate(d.biz_date); }}>
                  <span className={d.status === "LOCKED" ? "done" : ""}>{d.biz_date} {d.status === "LOCKED" ? "🔒" : ""}</span>
                </a>
              ))}
            </div>
          </Card>
        </>
      )}
    </>
  );
}
