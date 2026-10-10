"use client";
import { api, useApi } from "@/lib/api-client";
import { useT, useLang } from "@/lib/i18n";
import { PageHeader, Card, Table, Badge, Btn, Loading, ErrorBox, dt, useAction, ActionResult, MockNote, useMe } from "@/components/ui";
import { can } from "@/lib/roles";

export default function Notifications() {
  const t = useT();
  const { lang } = useLang();
  const me = useMe();
  const { data, error, reload } = useApi<any[]>("/api/notifications");
  const a = useAction();
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  return (
    <>
      <PageHeader id="C003" ja="お知らせ" vi="Thông báo"
        actions={
          <>
            {can(me?.roles, "notifyRun") && (
              <Btn kind="secondary" disabled={a.busy} onClick={() => a.run(async () => { const r = await api<{ created: number }>("/api/notifications/run", { body: {} }); reload(); return r; }, t("チェックを実行しました", "Đã chạy kiểm tra"))}>
                {t("通知チェックを実行", "Chạy kiểm tra thông báo")}
              </Btn>
            )}
            <Btn kind="secondary" onClick={() => a.run(async () => { await api("/api/notifications", { body: { all: true } }); reload(); })}>
              {t("すべて既読にする", "Đánh dấu tất cả đã đọc")}
            </Btn>
          </>
        } />
      <MockNote ja="通知は本来バッチで定期実行します。プロトタイプでは「通知チェックを実行」ボタンで生成します。メールは送信されず履歴のみ記録されます。"
        vi="Thông báo thật sẽ chạy bằng batch định kỳ. Prototype sinh thông báo bằng nút “Chạy kiểm tra”. Email không gửi thật, chỉ ghi lịch sử." />
      <ActionResult a={a} />
      <Card>
        <Table head={[t("日時", "Thời gian"), t("種別", "Loại"), t("重要度", "Mức độ"), t("件名", "Tiêu đề"), t("内容", "Nội dung"), t("宛先ロール", "Vai trò nhận"), ""]} empty={!data.length}>
          {data.map((n) => (
            <tr key={n.id} className={n.read ? "" : "unread"}>
              <td className="nowrap">{dt(n.created_at)}</td>
              <td><Badge group="event" value={n.event_type} tone="navy" /></td>
              <td><Badge group="severity" value={n.severity} /></td>
              <td>{lang === "ja" ? n.title_ja : n.title_vi}</td>
              <td className="small">{n.body}</td>
              <td><Badge group="role" value={n.target_role} tone="gray" /></td>
              <td>{!n.read && <Btn kind="ghost" className="btn btn-ghost btn-sm" onClick={() => a.run(async () => { await api("/api/notifications", { body: { id: n.id } }); reload(); })}>{t("既読", "Đã đọc")}</Btn>}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
