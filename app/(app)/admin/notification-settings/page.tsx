"use client";
import { useState } from "react";
import { api, useApi } from "@/lib/api-client";
import { useT, ENUM, useLang, useEnum } from "@/lib/i18n";
import { PageHeader, Card, Loading, ErrorBox, Btn, useAction, ActionResult, Field, dt } from "@/components/ui";
import { ROLES } from "@/lib/roles";

function Row({ s, onSaved }: { s: any; onSaved: () => void }) {
  const t = useT();
  const { lang } = useLang();
  const e = useEnum();
  const [v, setV] = useState<any>(s);
  const a = useAction();
  const toggle = (r: string) => setV({ ...v, recipient_roles: v.recipient_roles.includes(r) ? v.recipient_roles.filter((x: string) => x !== r) : [...v.recipient_roles, r] });
  return (
    <Card title={e("event", s.event_type)} actions={<span className="small muted">{t("更新", "Cập nhật")}: {dt(s.updated_at)}</span>}>
      <ActionResult a={a} />
      <div className="form-grid">
        <Field label={t("有効", "Bật")}><select value={v.enabled ? "1" : "0"} onChange={(x) => setV({ ...v, enabled: x.target.value === "1" })}><option value="1">ON</option><option value="0">OFF</option></select></Field>
        <Field label={t("重要度", "Mức độ")}><select value={v.severity} onChange={(x) => setV({ ...v, severity: x.target.value })}>{Object.entries(ENUM.severity).map(([k, p]) => <option key={k} value={k}>{lang === "ja" ? p[0] : p[1]}</option>)}</select></Field>
        <Field label={t("しきい値（日）", "Ngưỡng (ngày)")} hint={t("資格：期限の何日前から／引渡し：何日経過で滞留", "Tư cách: báo trước bao nhiêu ngày / Giao hàng: tồn sau bao nhiêu ngày")}><input type="number" min={0} value={v.threshold_days} onChange={(x) => setV({ ...v, threshold_days: x.target.value })} /></Field>
        <Field label={t("メール送信", "Gửi email")}><select value={v.email_enabled ? "1" : "0"} onChange={(x) => setV({ ...v, email_enabled: x.target.value === "1" })}><option value="1">ON</option><option value="0">OFF</option></select></Field>
        <div className="full"><Field label={t("宛先ロール", "Vai trò nhận")}>
          <div className="row">{ROLES.map((r) => <label key={r} className="row" style={{ gap: 4 }}><input type="checkbox" checked={v.recipient_roles.includes(r)} onChange={() => toggle(r)} /> {e("role", r)}</label>)}</div>
        </Field></div>
      </div>
      <Btn disabled={a.busy} onClick={() => a.run(async () => { await api("/api/notification-settings", { method: "PUT", body: v }); onSaved(); }, t("保存しました", "Đã lưu"))}>{t("保存", "Lưu")}</Btn>
    </Card>
  );
}

export default function NotificationSettings() {
  const t = useT();
  const { data, error, reload } = useApi<any[]>("/api/notification-settings");
  return (
    <>
      <PageHeader id="N001" ja="通知設定" vi="Cài đặt thông báo" />
      <p className="small muted">{t("基本範囲の通知チャネルはアプリ内とメール（SMS・FAXは対象外）。設定を変更しても過去の送信履歴は残ります（FR-NOTIFY-03）。",
        "Kênh baseline: trong app + email (không SMS/FAX). Đổi cấu hình không xóa lịch sử gửi trước đó (FR-NOTIFY-03).")}</p>
      <ErrorBox error={error} />
      {!data ? <Loading /> : data.map((s) => <Row key={s.event_type + s.updated_at} s={s} onSaved={reload} />)}
    </>
  );
}
