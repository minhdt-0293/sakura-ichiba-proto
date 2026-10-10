"use client";
import { useState } from "react";
import { useT, ENUM, useLang } from "@/lib/i18n";
import { ROLES } from "@/lib/roles";
import { Field, Btn } from "./ui";

export function UserForm({ initial, isNew, busy, onSubmit }: { initial: any; isNew: boolean; busy: boolean; onSubmit: (v: any) => void }) {
  const t = useT();
  const { lang } = useLang();
  const [v, setV] = useState<any>({ roles: [], active: true, ...initial });
  const toggle = (r: string) => setV({ ...v, roles: v.roles.includes(r) ? v.roles.filter((x: string) => x !== r) : [...v.roles, r] });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(v); }}>
      <div className="form-grid">
        <Field label={t("メールアドレス", "Email")} required><input type="email" value={v.email ?? ""} onChange={(e) => setV({ ...v, email: e.target.value })} disabled={!isNew} required /></Field>
        <Field label={t("表示名", "Tên hiển thị")} required><input value={v.display_name ?? ""} onChange={(e) => setV({ ...v, display_name: e.target.value })} required /></Field>
        <Field label={isNew ? t("初期パスワード（8文字以上）", "Mật khẩu ban đầu (≥ 8 ký tự)") : t("パスワード再設定（任意）", "Đặt lại mật khẩu (tùy chọn)")} required={isNew}>
          <input type="password" autoComplete="new-password" value={v.password ?? ""} onChange={(e) => setV({ ...v, password: e.target.value })} required={isNew} minLength={8} />
        </Field>
        {!isNew && (
          <Field label={t("状態", "Trạng thái")}>
            <select value={v.active ? "1" : "0"} onChange={(e) => setV({ ...v, active: e.target.value === "1" })}>
              <option value="1">{t("有効", "Hoạt động")}</option>
              <option value="0">{t("ロック（ログイン不可）", "Khóa (không đăng nhập được)")}</option>
            </select>
          </Field>
        )}
        <div className="full">
          <Field label={t("ロール（複数可）", "Vai trò (chọn nhiều)")} required>
            <div className="row">
              {ROLES.map((r) => (
                <label key={r} className="row" style={{ gap: 4 }}>
                  <input type="checkbox" checked={v.roles.includes(r)} onChange={() => toggle(r)} /> {lang === "ja" ? ENUM.role[r][0] : ENUM.role[r][1]}
                </label>
              ))}
            </div>
          </Field>
        </div>
        {!isNew && <div className="full"><Field label={t("変更理由", "Lý do thay đổi")} required><input value={v.reason ?? ""} onChange={(e) => setV({ ...v, reason: e.target.value })} required /></Field></div>}
      </div>
      <Btn disabled={busy}>{isNew ? t("作成", "Tạo") : t("保存", "Lưu")}</Btn>
    </form>
  );
}
