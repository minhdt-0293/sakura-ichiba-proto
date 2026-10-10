"use client";
import { useState } from "react";
import { useT, ENUM, useLang } from "@/lib/i18n";
import { Field, Btn } from "./ui";

export type PartyInput = Record<string, any>;

export function PartyForm({ initial, isNew, busy, onSubmit }: { initial: PartyInput; isNew: boolean; busy: boolean; onSubmit: (v: PartyInput) => void }) {
  const t = useT();
  const { lang } = useLang();
  const [v, setV] = useState<PartyInput>(initial);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  const statusChanged = !isNew && v.status !== initial.status;
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(v); }}>
      <div className="form-grid">
        <Field label={t("コード", "Mã")} required><input value={v.code ?? ""} onChange={set("code")} disabled={!isNew} required /></Field>
        <Field label={t("種別", "Loại")} required hint={t("仲卸＝許可、売買参加者＝承認、卸売業者・買出人＝登録", "仲卸 cần 許可, 売買参加者 cần 承認, bán buôn/買出人 cần 登録")}>
          <select value={v.kind ?? ""} onChange={set("kind")} disabled={!isNew} required>
            <option value="" />
            {Object.entries(ENUM.partyKind).map(([k, p]) => <option key={k} value={k}>{lang === "ja" ? p[0] : p[1]}</option>)}
          </select>
        </Field>
        <Field label={t("名称", "Tên")} required><input value={v.name ?? ""} onChange={set("name")} required /></Field>
        <Field label={t("フリガナ", "Phiên âm (kana)")}><input value={v.name_kana ?? ""} onChange={set("name_kana")} /></Field>
        <Field label={t("電話番号", "Điện thoại")}><input value={v.phone ?? ""} onChange={set("phone")} /></Field>
        <Field label={t("メール", "Email")}><input type="email" value={v.email ?? ""} onChange={set("email")} /></Field>
        <Field label={t("住所", "Địa chỉ")}><input value={v.address ?? ""} onChange={set("address")} /></Field>
        <Field label={t("参加上限（円）", "Hạn mức tham gia (¥)")} hint={t("保持・表示のみ。超過時の自動拒否は行いません（前提 Q-12）", "Chỉ lưu & hiển thị, không tự chặn khi vượt (giả định Q-12)")}>
          <input type="number" min={0} value={v.participation_limit ?? ""} onChange={set("participation_limit")} />
        </Field>
        {!isNew && (
          <Field label={t("状態", "Trạng thái")} required>
            <select value={v.status} onChange={set("status")}>
              {Object.entries(ENUM.partyStatus).map(([k, p]) => <option key={k} value={k}>{lang === "ja" ? p[0] : p[1]}</option>)}
            </select>
          </Field>
        )}
        {statusChanged && (
          <Field label={t("状態変更の理由", "Lý do đổi trạng thái")} required><input value={v.reason ?? ""} onChange={set("reason")} required /></Field>
        )}
        <div className="full"><Field label={t("備考", "Ghi chú")}><textarea value={v.note ?? ""} onChange={set("note")} /></Field></div>
      </div>
      <Btn disabled={busy}>{isNew ? t("登録", "Đăng ký") : t("保存", "Lưu")}</Btn>
    </form>
  );
}
