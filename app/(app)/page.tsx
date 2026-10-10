"use client";
import Link from "next/link";
import { useApi } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Stat, Loading, ErrorBox, yen, Badge, useMe, LinkBtn } from "@/components/ui";
import { can } from "@/lib/roles";

type Dash = {
  today: string; summary: any; lots: Record<string, number>; pending_corrections: number; open_disputes: number; overdue_disputes: number;
  delivery_backlog: number; qual_expiring: number; blocked_today: number; week: { date: string; AITAI: number; SERI: number }[];
  unlocked_past_days: string[];
};

export default function Dashboard() {
  const t = useT();
  const me = useMe();
  const { data, error } = useApi<Dash>("/api/dashboard");
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  const s = data.summary;
  const max = Math.max(1, ...data.week.map((w) => w.AITAI + w.SERI));
  const totalWeek = data.week.reduce((a, w) => a + w.AITAI + w.SERI, 0);
  const aitaiWeek = data.week.reduce((a, w) => a + w.AITAI, 0);
  return (
    <>
      <PageHeader id="C002" ja="ダッシュボード" vi="Bảng điều khiển"
        actions={
          <>
            {can(me?.roles, "lotCreate") && <LinkBtn href="/lots/new" kind="secondary">{t("ロット受付", "Tiếp nhận lot")}</LinkBtn>}
            {can(me?.roles, "tradeWrite") && <LinkBtn href="/trades/aitai/new">{t("相対取引を入力", "Ghi giao dịch thỏa thuận")}</LinkBtn>}
          </>
        } />
      <div className="stats">
        <Stat label={t("本日の相対取引", "GD thỏa thuận hôm nay")} value={s.aitai_count} href={`/trades?date=${data.today}&type=AITAI`} />
        <Stat label={t("本日のせり", "Đấu giá hôm nay")} value={s.seri_count} href={`/trades?date=${data.today}&type=SERI`} />
        <Stat label={t("本日の取引金額", "Tiền giao dịch hôm nay")} value={yen(Number(s.aitai_amount) + Number(s.seri_amount))} />
        <Stat label={t("本日のロット", "Lot hôm nay")} value={s.lots} href={`/lots?date=${data.today}`} />
        <Stat label={t("滞留引渡し（前日以前）", "Giao hàng tồn (ngày trước)")} value={data.delivery_backlog} tone={data.delivery_backlog ? "red" : undefined} href="/deliveries" />
        <Stat label={t("承認待ちの訂正申請", "Yêu cầu sửa chờ duyệt")} value={data.pending_corrections} tone={data.pending_corrections ? "amber" : undefined} href="/corrections?status=PENDING" />
        <Stat label={t("未解決の紛争（期限超過）", "Tranh chấp mở (quá hạn)")} value={`${data.open_disputes} (${data.overdue_disputes})`} tone={data.overdue_disputes ? "red" : undefined} href="/disputes" />
        <Stat label={t("30日以内に期限切れの資格", "Tư cách hết hạn trong 30 ngày")} value={data.qual_expiring} tone={data.qual_expiring ? "amber" : undefined} href="/reports/RPT-03" />
        <Stat label={t("本日ブロックされた操作", "Thao tác bị chặn hôm nay")} value={data.blocked_today} href="/admin/audit?result=BLOCKED" />
      </div>
      {data.unlocked_past_days.length > 0 && (
        <div className="alert alert-warn">
          {t("締め未完了の過去業務日があります：", "Còn ngày nghiệp vụ cũ chưa khóa: ")}
          {data.unlocked_past_days.map((d) => (
            <Link key={d} href={`/settlement?date=${d}`} style={{ marginLeft: 8 }}>{d}</Link>
          ))}
        </div>
      )}
      <div className="grid2">
        <Card title={t("直近7日の取引金額（相対／せり）", "Tiền giao dịch 7 ngày (相対 / せり)")}>
          <div className="bars">
            {data.week.map((w) => (
              <div key={w.date} className="bar-row">
                <span className="bar-label">{w.date.slice(5)}</span>
                <div className="bar-track">
                  <div className="bar bar-aitai" style={{ width: `${(w.AITAI / max) * 100}%` }} title={yen(w.AITAI)} />
                  <div className="bar bar-seri" style={{ width: `${(w.SERI / max) * 100}%` }} title={yen(w.SERI)} />
                </div>
                <span className="bar-val">{yen(w.AITAI + w.SERI)}</span>
              </div>
            ))}
          </div>
          <div className="row small muted" style={{ marginTop: 8 }}>
            <span><i className="dot dot-aitai" /> {t("相対取引", "Thỏa thuận")}</span>
            <span><i className="dot dot-seri" /> {t("せり", "Đấu giá")}</span>
            <span className="grow" />
            <span>{t("相対取引の比率", "Tỷ trọng 相対")}: <b>{totalWeek ? Math.round((aitaiWeek / totalWeek) * 100) : 0}%</b></span>
          </div>
        </Card>
        <Card title={t("本日の業務状況", "Tình hình nghiệp vụ hôm nay")}>
          <div className="flow">
            {(["RECEIVED", "INSPECTED", "ON_SALE", "SOLD_OUT"] as const).map((k) => (
              <span key={k}>
                <Badge group="lotStatus" value={k} /> {data.lots[k] ?? 0}
              </span>
            ))}
          </div>
          <p className="small muted">
            {t("日次照合の状態：", "Trạng thái đối soát ngày: ")} <Badge group="dayStatus" value={s.status} />{" "}
            <Link href="/settlement">{t("日次照合へ", "Tới đối soát ngày")} →</Link>
          </p>
          <p className="small muted">
            {t("目利き・下見の判断は人が行い、システムは結果のみを記録します。", "Thẩm định 目利き/下見 do con người thực hiện; hệ thống chỉ ghi kết quả.")}
          </p>
        </Card>
      </div>
    </>
  );
}
