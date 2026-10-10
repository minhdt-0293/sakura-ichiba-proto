"use client";
import Link from "next/link";
import { use } from "react";
import { useApi } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Table, Badge, Loading, ErrorBox, KV, yen, dt } from "@/components/ui";

export default function IncentiveDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const { data, error } = useApi<any>(`/api/incentives/${id}`);
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  const r = data.run;
  return (
    <>
      <PageHeader id="R004" ja={`完納奨励金 明細：${r.period}`} vi={`Chi tiết tiền thưởng: ${r.period}`} back="/incentives" />
      <Card>
        <KV items={[
          [t("期間", "Kỳ"), r.period],
          [t("適用料率版", "Version áp dụng"), <Link href={`/rates/${r.version.id}`}>v{r.version.version_no} ({t("発効", "hiệu lực")} {r.version.effective_from})</Link>],
          [t("料率", "Tỷ lệ"), r.version.rate_tiers.map((x: any) => `≥${yen(x.min_amount)}: ${(Number(x.rate) * 100).toFixed(2)}%`).join(" / ")],
          [t("奨励金合計", "Tổng thưởng"), <b>{yen(r.total_incentive)}</b>],
          [t("実行者 / 日時", "Người chạy / lúc"), `${r.runner?.display_name ?? ""} / ${dt(r.run_at)}`],
          [t("状態", "Trạng thái"), r.is_latest ? t("最新の計算結果", "Kết quả mới nhất") : t("過去の計算結果（再計算済）", "Kết quả cũ (đã tính lại)")],
        ]} />
      </Card>
      <Card title={t("参加者別明細", "Chi tiết theo người tham gia")}>
        <Table head={[t("参加者", "Người tham gia"), t("請求額", "Phải trả"), t("支払額", "Đã trả"), t("支払期日", "Hạn trả"), t("支払日", "Ngày trả"), t("判定", "Đánh giá"), t("対象金額", "Số tiền đủ ĐK"), t("料率", "Tỷ lệ"), t("計算式", "Công thức"), t("奨励金", "Tiền thưởng")]}>
          {data.results.map((x: any) => (
            <tr key={x.id}>
              <td>{x.party.code} {x.party.name}</td>
              <td className="num">{yen(x.billed_amount)}</td>
              <td className="num">{yen(x.paid_amount)}</td>
              <td className="nowrap">{x.due_date}</td>
              <td className="nowrap">{x.paid_date ?? "-"}</td>
              <td><Badge group="payReason" value={x.reason} /></td>
              <td className="num">{yen(x.eligible_amount)}</td>
              <td className="num">{(Number(x.rate) * 100).toFixed(2)}%</td>
              <td className="mono small nowrap">{x.on_time ? `⌊${Number(x.eligible_amount).toLocaleString()}×${(Number(x.rate) * 100).toFixed(2)}%×110/100⌋` : "0"}</td>
              <td className="num"><b>{yen(x.incentive_amount)}</b></td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
