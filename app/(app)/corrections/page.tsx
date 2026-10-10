"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApi } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Table, Badge, Loading, ErrorBox, qty, yen, dt } from "@/components/ui";

const TABS = [["PENDING", "承認待ち", "Chờ duyệt"], ["APPROVED", "承認済", "Đã duyệt"], ["REJECTED", "却下", "Bị bác"], ["", "すべて", "Tất cả"]];

export default function Corrections() {
  const t = useT();
  const sp = useSearchParams();
  const [st, setSt] = useState(sp.get("status") ?? "PENDING");
  const { data, error } = useApi<any[]>(`/api/corrections?status=${st}`);
  return (
    <>
      <PageHeader id="S007" ja="訂正申請一覧" vi="Danh sách yêu cầu sửa" />
      <p className="small muted">{t("確定済取引の訂正は、申請→別担当者の承認で行います。承認されると元の取引は変更せず、差分レコードを追加します（FR-CORR-01/02）。新規申請は取引詳細画面から行います。",
        "Sửa giao dịch đã chốt: lập yêu cầu → người khác duyệt. Khi duyệt, giao dịch gốc giữ nguyên, hệ thống thêm bản ghi delta (FR-CORR-01/02). Tạo yêu cầu mới từ màn hình chi tiết giao dịch.")}</p>
      <div className="tabs">{TABS.map(([k, ja, vi]) => <button key={k} className={st === k ? "on" : ""} onClick={() => setSt(k)}>{t(ja, vi)}</button>)}</div>
      <Card>
        <ErrorBox error={error} />
        {!data ? <Loading /> : (
          <Table head={[t("申請番号", "Số YC"), t("取引", "Giao dịch"), t("業務日", "Ngày NV"), t("現在 → 申請後", "Hiện tại → đề nghị"), t("理由", "Lý do"), t("申請者", "Người lập"), t("申請日時", "Lúc lập"), t("状態", "Trạng thái"), t("承認者", "Người duyệt")]} empty={!data.length}>
            {data.map((r) => (
              <tr key={r.id}>
                <td className="mono"><Link href={`/corrections/${r.id}`}>{r.req_no}</Link></td>
                <td className="mono"><Link href={`/trades/${r.trade?.id}`}>{r.trade?.trade_no}</Link></td>
                <td>{r.trade?.biz_date}</td>
                <td className="small nowrap">{r.status === "PENDING" ? <>{qty(r.trade?.eff_quantity)} × {yen(r.trade?.eff_unit_price)} → </> : null}<b>{qty(r.new_quantity)} × {yen(r.new_unit_price)}</b></td>
                <td className="small">{r.reason}</td>
                <td className="small">{r.requester?.display_name}</td>
                <td className="small nowrap">{dt(r.requested_at)}</td>
                <td><Badge group="reqStatus" value={r.status} /></td>
                <td className="small">{r.reviewer?.display_name}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
