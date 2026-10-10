"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import { useLang, useT, useEnum } from "@/lib/i18n";
import { useApi } from "@/lib/api-client";
import { browserClient } from "@/lib/supabase-browser";
import { MeCtx, Me, Loading } from "./ui";
import { can, PERM } from "@/lib/roles";

export function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-switch" role="group" aria-label="Language">
      <button className={lang === "ja" ? "on" : ""} onClick={() => setLang("ja")} type="button">
        日本語
      </button>
      <button className={lang === "vi" ? "on" : ""} onClick={() => setLang("vi")} type="button">
        Tiếng Việt
      </button>
    </div>
  );
}

type Item = { href: string; id: string; ja: string; vi: string; perm?: keyof typeof PERM };
const NAV: { ja: string; vi: string; items: Item[] }[] = [
  {
    ja: "ホーム", vi: "Trang chủ",
    items: [
      { href: "/", id: "C002", ja: "ダッシュボード", vi: "Bảng điều khiển" },
      { href: "/notifications", id: "C003", ja: "お知らせ", vi: "Thông báo" },
    ],
  },
  {
    ja: "日々の業務", vi: "Nghiệp vụ hằng ngày",
    items: [
      { href: "/lots", id: "L001", ja: "ロット", vi: "Lot hàng" },
      { href: "/trades/aitai/new", id: "T002", ja: "相対取引入力", vi: "Ghi giao dịch thỏa thuận", perm: "tradeWrite" },
      { href: "/trades/seri/new", id: "T004", ja: "せり結果入力", vi: "Nhập kết quả đấu giá", perm: "tradeWrite" },
      { href: "/trades", id: "T001", ja: "取引一覧", vi: "Danh sách giao dịch" },
      { href: "/deliveries", id: "D001", ja: "引渡し", vi: "Giao hàng" },
    ],
  },
  {
    ja: "照合・締め", vi: "Đối soát & chốt sổ",
    items: [
      { href: "/settlement", id: "S001", ja: "日次照合・締め", vi: "Đối soát ngày & khóa ngày" },
      { href: "/corrections", id: "S007", ja: "訂正申請", vi: "Yêu cầu sửa" },
      { href: "/disputes", id: "S003", ja: "紛争", vi: "Tranh chấp" },
    ],
  },
  {
    ja: "規程・奨励金", vi: "Quy định & tiền thưởng",
    items: [
      { href: "/rates", id: "R001", ja: "料率版", vi: "Version tỷ lệ" },
      { href: "/incentives", id: "R003", ja: "完納奨励金", vi: "Tiền thưởng đúng hạn" },
    ],
  },
  {
    ja: "マスタ・帳票", vi: "Danh mục & báo cáo",
    items: [
      { href: "/parties", id: "P001", ja: "参加者", vi: "Người tham gia" },
      { href: "/reports", id: "B001", ja: "帳票", vi: "Báo cáo" },
      { href: "/export", id: "B003", ja: "会計データ出力", vi: "Xuất dữ liệu kế toán", perm: "accountingExport" },
    ],
  },
  {
    ja: "管理", vi: "Quản trị",
    items: [
      { href: "/admin/users", id: "A001", ja: "アカウント", vi: "Tài khoản", perm: "admin" },
      { href: "/admin/audit", id: "A003", ja: "操作ログ", vi: "Nhật ký thao tác", perm: "auditRead" },
      { href: "/admin/notification-settings", id: "N001", ja: "通知設定", vi: "Cài đặt thông báo", perm: "notifySettings" },
      { href: "/admin/notification-log", id: "N002", ja: "通知送信履歴", vi: "Lịch sử gửi thông báo", perm: "notifyRun" },
      { href: "/admin/holidays", id: "A004", ja: "休市日", vi: "Lịch nghỉ chợ", perm: "admin" },
      { href: "/admin/masters", id: "A005", ja: "マスタ", vi: "Danh mục dùng chung", perm: "admin" },
    ],
  },
];

export function Shell({ children }: { children: ReactNode }) {
  const { data: me, error } = useApi<Me>("/api/me");
  const { data: unread } = useApi<{ unread: number }>("/api/notifications?count=1");
  const { lang } = useLang();
  const t = useT();
  const e = useEnum();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await browserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (error) {
    return (
      <div className="pad">
        <p>{t("セッションが無効です。", "Phiên đăng nhập không hợp lệ.")}</p>
        <button className="btn btn-primary" onClick={logout}>
          {t("ログイン画面へ", "Về trang đăng nhập")}
        </button>
      </div>
    );
  }
  if (!me) return <Loading />;

  const isActive = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));

  return (
    <MeCtx.Provider value={me}>
      <div className={"app " + (open ? "nav-open" : "")}>
        <aside className="sidebar">
          <Link href="/" className="brand">
            <span className="brand-mark">桜</span>
            <span>
              <b>{t("桜水産市場", "Chợ Sakura")}</b>
              <small>{t("業務支援システム", "Hệ thống nghiệp vụ")}</small>
            </span>
          </Link>
          <nav>
            {NAV.map((g) => {
              const items = g.items.filter((i) => !i.perm || can(me.roles, i.perm));
              if (!items.length) return null;
              return (
                <div key={g.ja} className="nav-group">
                  <div className="nav-title">{lang === "ja" ? g.ja : g.vi}</div>
                  {items.map((i) => (
                    <Link key={i.href} href={i.href} className={"nav-item " + (isActive(i.href) ? "active" : "")} onClick={() => setOpen(false)}>
                      <span>{lang === "ja" ? i.ja : i.vi}</span>
                      <span className="nav-id">{i.id}</span>
                    </Link>
                  ))}
                </div>
              );
            })}
          </nav>
        </aside>
        <div className="main">
          <header className="topbar">
            <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="menu">
              ☰
            </button>
            <div className="today">
              {t("業務日", "Ngày nghiệp vụ")}: <b>{me.today}</b> (JST)
            </div>
            <div className="topbar-right">
              <Link href="/notifications" className="bell" title={t("お知らせ", "Thông báo")}>
                🔔{unread && unread.unread > 0 ? <span className="bell-count">{unread.unread}</span> : null}
              </Link>
              <LangSwitch />
              <div className="user">
                <b>{me.display_name}</b>
                <small>{me.roles.map((r) => e("role", r)).join(" · ")}</small>
              </div>
              <button className="btn btn-ghost" onClick={logout}>
                {t("ログアウト", "Đăng xuất")}
              </button>
            </div>
          </header>
          <main className="content">{children}</main>
        </div>
      </div>
    </MeCtx.Provider>
  );
}
