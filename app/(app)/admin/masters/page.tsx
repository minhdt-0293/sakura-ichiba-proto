"use client";
import { useState } from "react";
import { api, useApi } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Table, Loading, ErrorBox, Field, Btn, useAction, ActionResult } from "@/components/ui";

const CATS: [string, string, string][] = [["ITEM", "品目", "Mặt hàng"], ["UNIT", "単位", "Đơn vị"], ["GRADE", "等級", "Hạng"], ["DELIVERY_EXCEPTION", "引渡し例外", "Ngoại lệ giao hàng"], ["DISPUTE_CAUSE", "紛争原因", "Nguyên nhân tranh chấp"]];

export default function Masters() {
  const t = useT();
  const { data, error, reload } = useApi<any[]>("/api/masters");
  const [cat, setCat] = useState("ITEM");
  const [v, setV] = useState<any>({});
  const [edit, setEdit] = useState<any>(null);
  const a = useAction();
  const rows = (data ?? []).filter((m) => m.category === cat);
  return (
    <>
      <PageHeader id="A005" ja="マスタ管理" vi="Danh mục dùng chung" />
      <div className="tabs">{CATS.map(([k, ja, vi]) => <button key={k} className={cat === k ? "on" : ""} onClick={() => setCat(k)}>{t(ja, vi)}</button>)}</div>
      <Card>
        <ActionResult a={a} />
        <form className="row" onSubmit={(e) => { e.preventDefault(); a.run(async () => { await api("/api/masters", { body: { ...v, category: cat } }); setV({}); reload(); }, t("追加しました", "Đã thêm")); }}>
          <Field label={t("コード", "Mã")} required><input value={v.code ?? ""} onChange={(e) => setV({ ...v, code: e.target.value })} required /></Field>
          <Field label={t("名称（日本語）", "Tên (tiếng Nhật)")} required><input value={v.name_ja ?? ""} onChange={(e) => setV({ ...v, name_ja: e.target.value })} required /></Field>
          <Field label={t("名称（ベトナム語）", "Tên (tiếng Việt)")} required><input value={v.name_vi ?? ""} onChange={(e) => setV({ ...v, name_vi: e.target.value })} required /></Field>
          <Field label={t("並び順", "Thứ tự")}><input type="number" value={v.sort ?? ""} onChange={(e) => setV({ ...v, sort: e.target.value })} /></Field>
          <Btn disabled={a.busy}>{t("追加", "Thêm")}</Btn>
        </form>
        <ErrorBox error={error} />
        {!data ? <Loading /> : (
          <Table head={[t("コード", "Mã"), t("日本語", "Tiếng Nhật"), t("ベトナム語", "Tiếng Việt"), t("並び順", "Thứ tự"), t("使用中", "Đang dùng"), ""]}>
            {rows.map((m) => edit?.id === m.id ? (
              <tr key={m.id}>
                <td className="mono">{m.code}</td>
                <td><input value={edit.name_ja} onChange={(e) => setEdit({ ...edit, name_ja: e.target.value })} /></td>
                <td><input value={edit.name_vi} onChange={(e) => setEdit({ ...edit, name_vi: e.target.value })} /></td>
                <td><input type="number" value={edit.sort} onChange={(e) => setEdit({ ...edit, sort: e.target.value })} /></td>
                <td><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /></td>
                <td className="nowrap"><Btn onClick={() => a.run(async () => { await api("/api/masters", { method: "PUT", body: edit }); setEdit(null); reload(); })}>{t("保存", "Lưu")}</Btn></td>
              </tr>
            ) : (
              <tr key={m.id}>
                <td className="mono">{m.code}</td><td>{m.name_ja}</td><td>{m.name_vi}</td><td>{m.sort}</td><td>{m.active ? "○" : "×"}</td>
                <td><Btn kind="ghost" onClick={() => setEdit(m)}>{t("編集", "Sửa")}</Btn></td>
              </tr>
            ))}
          </Table>
        )}
        <p className="small muted">{t("※ 過去データが参照しているため物理削除はできません。「使用中」を外すと新規入力の選択肢から消えます。", "※ Không xóa vật lý vì dữ liệu cũ đang tham chiếu. Bỏ “Đang dùng” để ẩn khỏi lựa chọn khi nhập mới.")}</p>
      </Card>
    </>
  );
}
