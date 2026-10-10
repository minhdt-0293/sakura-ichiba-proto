"use client";
import Link from "next/link";
import { useApi } from "@/lib/api-client";
import { useT, useLang } from "@/lib/i18n";
import { PageHeader, Card, Table, Loading, ErrorBox } from "@/components/ui";

const FREQ: Record<string, [string, string]> = { DAILY: ["日次", "Hằng ngày"], MONTHLY: ["月次", "Hằng tháng"], EVENT: ["変更時", "Khi thay đổi"] };

export default function Reports() {
  const t = useT();
  const { lang } = useLang();
  const { data, error } = useApi<any[]>("/api/reports");
  return (
    <>
      <PageHeader id="B001" ja="帳票一覧" vi="Danh sách báo cáo" />
      <p className="small muted">{t("基本範囲の定型帳票12種（TBL-REPORT-01）。すべて絞り込みとCSV出力に対応。利用者による帳票作成ツールは対象外（OPT-E）。",
        "12 báo cáo cố định của baseline (TBL-REPORT-01), đều lọc được và xuất CSV. Không có công cụ tự thiết kế báo cáo (option OPT-E).")}</p>
      <Card>
        <ErrorBox error={error} />
        {!data ? <Loading /> : (
          <Table head={["ID", t("帳票名", "Tên báo cáo"), t("頻度", "Tần suất"), t("条件", "Điều kiện lọc")]}>
            {data.map((r) => (
              <tr key={r.code}>
                <td className="mono">{r.code}</td>
                <td><Link href={`/reports/${r.code}`}>{lang === "ja" ? r.ja : r.vi}</Link></td>
                <td>{lang === "ja" ? FREQ[r.freq][0] : FREQ[r.freq][1]}</td>
                <td className="small">{r.param === "date" ? t("業務日", "Ngày NV") : r.param === "period" ? t("月", "Tháng") : "-"}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
