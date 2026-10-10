"use client";
import { useState } from "react";
import { useApi } from "@/lib/api-client";
import { useT, useLang } from "@/lib/i18n";
import { PageHeader, Card, Table, Badge, Loading, ErrorBox, Field, dt, MockNote } from "@/components/ui";

export default function NotificationLog() {
  const t = useT();
  const { lang } = useLang();
  const [f, setF] = useState({ channel: "", status: "" });
  const { data, error } = useApi<any[]>(`/api/notifications/log?${new URLSearchParams(f)}`);
  const failed = (data ?? []).filter((n) => n.ops_alert);
  return (
    <>
      <PageHeader id="N002" ja="通知送信履歴" vi="Lịch sử gửi thông báo" />
      <MockNote ja="メールは実際には送信しません。宛先に「fail」を含むアドレスは送信失敗を模擬し、3回リトライ後に運用アラート対象になります（FR-NOTIFY-02）。"
        vi="Email không gửi thật. Địa chỉ chứa “fail” giả lập gửi lỗi: thử lại 3 lần rồi đưa vào hàng đợi cảnh báo vận hành (FR-NOTIFY-02)." />
      {failed.length > 0 && <div className="alert alert-error">{t(`運用アラート：送信失敗 ${failed.length} 件`, `Cảnh báo vận hành: ${failed.length} thông báo gửi lỗi`)}</div>}
      <Card>
        <div className="filters">
          <Field label={t("チャネル", "Kênh")}><select value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })}><option value="">{t("すべて", "Tất cả")}</option><option value="IN_APP">IN_APP</option><option value="EMAIL">EMAIL</option></select></Field>
          <Field label={t("結果", "Kết quả")}><select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">{t("すべて", "Tất cả")}</option><option value="SENT">SENT</option><option value="FAILED">FAILED</option></select></Field>
        </div>
        <ErrorBox error={error} />
        {!data ? <Loading /> : (
          <Table head={[t("日時", "Thời điểm"), t("種別", "Loại"), t("チャネル", "Kênh"), t("宛先", "Người nhận"), t("件名", "Tiêu đề"), t("内容", "Nội dung"), t("試行回数", "Số lần thử"), t("結果", "Kết quả")]} empty={!data.length}>
            {data.map((n) => (
              <tr key={n.id}>
                <td className="small nowrap">{dt(n.created_at)}</td>
                <td><Badge group="event" value={n.event_type} tone="navy" /></td>
                <td><Badge group="channel" value={n.channel} tone="gray" /></td>
                <td className="small">{n.recipient ?? n.target_role}</td>
                <td className="small">{lang === "ja" ? n.title_ja : n.title_vi}</td>
                <td className="small">{n.body}</td>
                <td className="num">{n.attempts}</td>
                <td><Badge group="sendStatus" value={n.status} />{n.ops_alert && <span className="badge badge-red"> ALERT</span>}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
