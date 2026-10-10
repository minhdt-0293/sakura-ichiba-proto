"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, useApi } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Table, Loading, ErrorBox, Field, Btn, useAction, ActionResult, useMe, yen, dt, RoleGate, MockNote } from "@/components/ui";
import { can } from "@/lib/roles";

export default function Incentives() {
  const t = useT();
  const me = useMe();
  const router = useRouter();
  const { data, error } = useApi<any>("/api/incentives");
  const a = useAction();
  const [period, setPeriod] = useState("");
  return (
    <>
      <PageHeader id="R003" ja="完納奨励金の計算" vi="Tính tiền thưởng thanh toán đúng hạn (完納奨励金)" />
      <div className="alert alert-info">
        <b>{t("計算ルール", "Quy tắc tính")}</b>：{t("奨励金 ＝ 切捨て（期日内支払額 × 料率 × 110/100）。期日を1日でも過ぎた支払・未払いは 0 円（猶予なし）。料率は期間末日に有効な承認済の版を適用（BR-INC-01）。",
          "Thưởng = làm tròn xuống (số tiền trả trong hạn × tỷ lệ × 110/100). Trả trễ dù 1 ngày hoặc chưa trả → 0 (không ân hạn). Áp version tỷ lệ đã duyệt có hiệu lực vào ngày cuối kỳ (BR-INC-01).")}
      </div>
      <MockNote ja="支払実績はダミーデータ（決済機能は対象外）。対象金額の定義・料率の段階構成は当社前提（Q-05, Q-06）で、付録Cのテストベクタ受領後に検証が必要です。"
        vi="Dữ liệu thanh toán là dữ liệu giả (không có module thanh toán). Định nghĩa số tiền đủ điều kiện và bậc tỷ lệ là giả định (Q-05, Q-06), cần kiểm chứng khi có test vector Phụ lục C." />
      <Card title={t("計算の実行", "Chạy tính")}>
        <RoleGate ok={can(me?.roles, "incentiveRun")}>
          <ActionResult a={a} />
          <form className="row" onSubmit={(e) => { e.preventDefault(); a.run(async () => { const r = await api<any>("/api/incentives", { body: { period } }); router.push(`/incentives/${r.id}`); }); }}>
            <Field label={t("対象期間（月）", "Kỳ (tháng)")} required>
              <select value={period} onChange={(e) => setPeriod(e.target.value)} required>
                <option value="" />
                {(data?.periods ?? []).map((p: string) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Btn disabled={a.busy}>{t("計算する", "Tính")}</Btn>
          </form>
          <p className="small muted">{t("再計算すると新しい計算結果として保存され、以前の結果も履歴として残ります。", "Tính lại sẽ lưu thành lần chạy mới, kết quả cũ vẫn giữ trong lịch sử.")}</p>
        </RoleGate>
      </Card>
      <Card title={t("計算履歴", "Lịch sử tính")}>
        <ErrorBox error={error} />
        {!data ? <Loading /> : (
          <Table head={[t("期間", "Kỳ"), t("適用料率版", "Version tỷ lệ"), t("奨励金合計", "Tổng thưởng"), t("実行者", "Người chạy"), t("実行日時", "Lúc chạy"), t("最新", "Mới nhất")]} empty={!data.runs.length}>
            {data.runs.map((r: any) => (
              <tr key={r.id}>
                <td><Link href={`/incentives/${r.id}`}>{r.period}</Link></td>
                <td>v{r.version?.version_no}</td>
                <td className="num">{yen(r.total_incentive)}</td>
                <td className="small">{r.runner?.display_name}</td>
                <td className="small nowrap">{dt(r.run_at)}</td>
                <td>{r.is_latest ? "○" : ""}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
