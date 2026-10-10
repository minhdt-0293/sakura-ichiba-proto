"use client";
import Link from "next/link";
import { useApi } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Table, Badge, Loading, ErrorBox, LinkBtn, useMe, yen, dt } from "@/components/ui";
import { can } from "@/lib/roles";

export default function Rates() {
  const t = useT();
  const me = useMe();
  const { data, error } = useApi<any>("/api/rates");
  return (
    <>
      <PageHeader id="R001" ja="料率版一覧（完納奨励金）" vi="Danh sách version tỷ lệ thưởng" actions={can(me?.roles, "rateDraft") && <LinkBtn href="/rates/new">{t("新しい版を起票", "Soạn version mới")}</LinkBtn>} />
      <div className="alert alert-info">
        {t("料率は版管理されます：起票者と承認者は別の人、発効日は本日以降、同一年の変更は4回まで。過去の計算結果は書き換えません（GOV-RULE-01）。",
           "Tỷ lệ được quản lý theo version: người lập ≠ người duyệt, ngày hiệu lực từ hôm nay trở đi, tối đa 4 lần/năm. Không ghi đè kết quả đã tính (GOV-RULE-01).")}
        {data && <> — {t("今年の承認済変更", "Số lần đã duyệt năm nay")}: <b>{data.used_this_year} / 4</b></>}
      </div>
      <Card>
        <ErrorBox error={error} />
        {!data ? <Loading /> : (
          <Table head={[t("版", "Version"), t("発効日", "Hiệu lực từ"), t("料率", "Tỷ lệ"), t("状態", "Trạng thái"), t("起票者", "Người lập"), t("承認者", "Người duyệt"), t("承認日時", "Lúc duyệt"), t("備考", "Ghi chú")]} empty={!data.versions.length}>
            {data.versions.map((v: any) => (
              <tr key={v.id}>
                <td className="mono"><Link href={`/rates/${v.id}`}>v{v.version_no}</Link> {v.id === data.current_id && <span className="badge badge-green">{t("現在適用中", "Đang áp dụng")}</span>}</td>
                <td>{v.effective_from}</td>
                <td className="small">{v.rate_tiers.map((x: any) => <div key={x.min_amount}>≥ {yen(x.min_amount)} : <b>{(Number(x.rate) * 100).toFixed(2)}%</b></div>)}</td>
                <td><Badge group="rateStatus" value={v.status} /></td>
                <td className="small">{v.creator?.display_name}</td>
                <td className="small">{v.approver?.display_name}</td>
                <td className="small nowrap">{dt(v.approved_at)}</td>
                <td className="small">{v.note}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
