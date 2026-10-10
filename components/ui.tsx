"use client";
import Link from "next/link";
import { ReactNode, useCallback, useState, createContext, useContext } from "react";
import { useLang, useT, useErr, useEnum } from "@/lib/i18n";
import { ClientApiError } from "@/lib/api-client";
import type { Role } from "@/lib/roles";

/* ---------- Người dùng hiện tại ---------- */
export type Me = { id: string; email: string; display_name: string; roles: Role[]; today: string };
export const MeCtx = createContext<Me | null>(null);
export const useMe = () => useContext(MeCtx);

/* ---------- Định dạng ---------- */
export const yen = (v: number | string | null | undefined) => {
  if (v == null || v === "") return "";
  const n = Number(v);
  return (n < 0 ? "-¥" : "¥") + Math.abs(n).toLocaleString("ja-JP", { maximumFractionDigits: 0 });
};
export const qty = (v: number | string | null | undefined, unit?: string | null) =>
  v == null ? "" : Number(v).toLocaleString("ja-JP", { maximumFractionDigits: 1 }) + (unit ? " " + unit.toLowerCase() : "");
export const dt = (v: string | null | undefined) => {
  if (!v) return "";
  const d = new Date(v);
  const j = new Date(d.getTime() + 9 * 3600 * 1000);
  return j.toISOString().slice(0, 16).replace("T", " ");
};

/* ---------- Bố cục ---------- */
export function PageHeader({ id, ja, vi, actions, back }: { id: string; ja: string; vi: string; actions?: ReactNode; back?: string }) {
  const { lang } = useLang();
  return (
    <div className="page-header">
      <div>
        {back && (
          <Link href={back} className="back-link">
            ← {lang === "ja" ? "戻る" : "Quay lại"}
          </Link>
        )}
        <h1>
          <span className="screen-id">{id}</span>
          {lang === "ja" ? ja : vi}
        </h1>
        <div className="subtitle">{lang === "ja" ? vi : ja}</div>
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, actions, className }: { title?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={"card " + (className ?? "")}>
      {(title || actions) && (
        <div className="card-head">
          <h2>{title}</h2>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Badge({ group, value, tone }: { group?: string; value: string | null | undefined; tone?: string }) {
  const e = useEnum();
  if (!value) return null;
  const label = group ? e(group, value) : value;
  const t = tone ?? TONE[value] ?? "gray";
  return <span className={"badge badge-" + t}>{label}</span>;
}
const TONE: Record<string, string> = {
  ACTIVE: "green", VALID: "green", CONFIRMED: "green", COMPLETED: "green", APPROVED: "green", RESOLVED: "green", SENT: "green", OK: "green",
  ON_SALE: "blue", INSPECTED: "teal", RECEIVED: "gray", SOLD_OUT: "gray", OPEN: "amber", IN_PROGRESS: "blue",
  PENDING: "amber", PARTIAL: "blue", DRAFT: "amber", LOCKED: "gray",
  SUSPENDED: "red", INACTIVE: "gray", REVOKED: "red", CANCELLED: "gray", EXCEPTION: "red", REJECTED: "red", FAILED: "red", BLOCKED: "red",
  AITAI: "navy", SERI: "purple", CRITICAL: "red", INFO: "gray", ON_TIME: "green", LATE: "red", UNPAID: "red",
  PERMIT: "navy", APPROVAL: "purple", REGISTRATION: "teal",
};

export function Loading() {
  const t = useT();
  return <div className="muted pad">{t("読み込み中…", "Đang tải…")}</div>;
}

export function Empty() {
  const t = useT();
  return <div className="muted pad">{t("データがありません", "Không có dữ liệu")}</div>;
}

export function ErrorBox({ error }: { error: unknown }) {
  const err = useErr();
  if (!error) return null;
  const e = error as ClientApiError;
  return <div className="alert alert-error">{err(e.code ?? "SERVER_ERROR", e.detail)}</div>;
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" | "ok" | "mock" }) {
  return <div className={"alert alert-" + tone}>{children}</div>;
}

export function MockNote({ ja, vi }: { ja: string; vi: string }) {
  const t = useT();
  return (
    <div className="alert alert-mock">
      <b>MOCK</b> {t(ja, vi)}
    </div>
  );
}

/* ---------- Form ---------- */
export function Field({ label, children, hint, required }: { label: string; children: ReactNode; hint?: string; required?: boolean }) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required && <span className="req">*</span>}
      </span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Btn({ children, kind = "primary", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: "primary" | "secondary" | "danger" | "ghost" }) {
  return (
    <button className={"btn btn-" + kind} {...p}>
      {children}
    </button>
  );
}

export function LinkBtn({ href, children, kind = "primary" }: { href: string; children: ReactNode; kind?: string }) {
  return (
    <Link href={href} className={"btn btn-" + kind}>
      {children}
    </Link>
  );
}

/** Chạy một thao tác ghi: quản lý trạng thái đang chạy / lỗi / thông báo thành công */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [done, setDone] = useState<string | null>(null);
  const run = useCallback(async <T,>(fn: () => Promise<T>, okMsg?: string): Promise<T | undefined> => {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const r = await fn();
      if (okMsg) setDone(okMsg);
      return r;
    } catch (e) {
      setError(e);
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, error, done, run, setError };
}

export function ActionResult({ a }: { a: { error: unknown; done: string | null } }) {
  return (
    <>
      <ErrorBox error={a.error} />
      {a.done && <div className="alert alert-ok">{a.done}</div>}
    </>
  );
}

/* ---------- Bảng ---------- */
export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty && <Empty />}
    </div>
  );
}

export function Stat({ label, value, tone, href }: { label: string; value: ReactNode; tone?: string; href?: string }) {
  const inner = (
    <div className={"stat " + (tone ? "stat-" + tone : "")}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
  return href ? <Link href={href} className="stat-link">{inner}</Link> : inner;
}

export function KV({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="kv">
      {items.map(([k, v], i) => (
        <div key={i}>
          <dt>{k}</dt>
          <dd>{v ?? ""}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Hiển thị khi người dùng không có vai trò cần thiết */
export function RoleGate({ ok, children }: { ok: boolean; children: ReactNode }) {
  const t = useT();
  if (ok) return <>{children}</>;
  return <div className="muted small">{t("※ この操作の権限がありません（閲覧のみ）", "※ Bạn không có quyền thao tác này (chỉ xem)")}</div>;
}
