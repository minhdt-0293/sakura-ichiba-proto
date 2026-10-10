"use client";
import { useState } from "react";
import { api, useApi } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Table, Loading, ErrorBox, Field, Btn, useAction, ActionResult, MockNote } from "@/components/ui";

export default function Holidays() {
  const t = useT();
  const { data, error, reload } = useApi<any[]>("/api/holidays");
  const a = useAction();
  const [v, setV] = useState<any>({});
  return (
    <>
      <PageHeader id="A004" ja="休市日カレンダー" vi="Lịch nghỉ của chợ" />
      <MockNote ja="プロトタイプでは休市日は登録・表示のみで、業務日の入力制限には使用していません。" vi="Prototype chỉ lưu và hiển thị ngày nghỉ, chưa dùng để chặn nhập liệu vào ngày nghỉ." />
      <Card>
        <ActionResult a={a} />
        <form className="row" onSubmit={(e) => { e.preventDefault(); a.run(async () => { await api("/api/holidays", { body: v }); setV({}); reload(); }, t("追加しました", "Đã thêm")); }}>
          <Field label={t("日付", "Ngày")} required><input type="date" value={v.holiday ?? ""} onChange={(e) => setV({ ...v, holiday: e.target.value })} required /></Field>
          <Field label={t("名称", "Tên")} required><input value={v.name ?? ""} onChange={(e) => setV({ ...v, name: e.target.value })} required /></Field>
          <Btn disabled={a.busy}>{t("追加", "Thêm")}</Btn>
        </form>
        <ErrorBox error={error} />
        {!data ? <Loading /> : (
          <Table head={[t("日付", "Ngày"), t("名称", "Tên"), ""]} empty={!data.length}>
            {data.map((h) => (
              <tr key={h.holiday}><td>{h.holiday}</td><td>{h.name}</td>
                <td><Btn kind="ghost" onClick={() => a.run(async () => { await api(`/api/holidays?date=${h.holiday}`, { method: "DELETE" }); reload(); })}>{t("削除", "Xóa")}</Btn></td></tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
