"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, useApi } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Field, Btn, useAction, ActionResult, useMe, RoleGate, KV, qty, yen, Loading, ErrorBox, Notice } from "@/components/ui";
import { can } from "@/lib/roles";

export default function NewCorrection() {
  const t = useT();
  const me = useMe();
  const sp = useSearchParams();
  const router = useRouter();
  const tradeId = sp.get("trade");
  const { data, error } = useApi<any>(tradeId ? `/api/trades/${tradeId}` : null);
  const a = useAction();
  const [v, setV] = useState<any>(null);
  if (!tradeId) return <Notice tone="warn">{t("取引詳細画面から申請してください。", "Hãy tạo yêu cầu từ màn hình chi tiết giao dịch.")}</Notice>;
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  const x = data.trade;
  const form = v ?? { new_quantity: x.eff_quantity, new_unit_price: x.eff_unit_price };
  const set = (k: string) => (e: any) => setV({ ...form, [k]: e.target.value });
  const newAmount = Math.floor(Number(form.new_quantity) * Number(form.new_unit_price));
  return (
    <>
      <PageHeader id="S006" ja="訂正申請の作成" vi="Tạo yêu cầu sửa giao dịch" back={`/trades/${tradeId}`} />
      {data.day_locked && <Notice tone="warn">{t("元の業務日は締め済です。承認後の差分は、承認日の業務日に計上されます。", "Ngày gốc đã khóa. Sau khi duyệt, delta được ghi nhận vào ngày nghiệp vụ lúc duyệt.")}</Notice>}
      <Card title={t("対象取引（現在の有効値）", "Giao dịch (giá trị hiệu lực hiện tại)")}>
        <KV items={[
          [t("取引", "Giao dịch"), <Link href={`/trades/${x.id}`} className="mono">{x.trade_no}</Link>],
          [t("業務日", "Ngày NV"), x.biz_date],
          [t("買い手", "Bên mua"), `${x.buyer.code} ${x.buyer.name}`],
          [t("数量", "SL"), qty(x.eff_quantity, x.lot.unit)],
          [t("単価", "Đơn giá"), yen(x.eff_unit_price)],
          [t("金額", "Tiền"), yen(x.eff_amount)],
          [t("引渡し済", "Đã giao"), qty(x.delivered_qty, x.lot.unit)],
        ]} />
      </Card>
      <Card title={t("訂正内容", "Nội dung sửa")}>
        <RoleGate ok={can(me?.roles, "correctionRequest")}>
          <ActionResult a={a} />
          <form onSubmit={(e) => { e.preventDefault(); a.run(async () => { const r = await api<any>("/api/corrections", { body: { ...form, trade_id: tradeId } }); router.push(`/corrections/${r.id}`); }); }}>
            <div className="form-grid">
              <Field label={t("訂正後の数量", "Số lượng sau sửa")} required><input type="number" step={0.1} min={0.1} value={form.new_quantity} onChange={set("new_quantity")} required /></Field>
              <Field label={t("訂正後の単価（円）", "Đơn giá sau sửa (¥)")} required><input type="number" min={0} value={form.new_unit_price} onChange={set("new_unit_price")} required /></Field>
              <Field label={t("訂正後の金額 / 差額", "Tiền sau sửa / chênh lệch")}><input readOnly value={`${yen(newAmount)}  (Δ ${yen(newAmount - Number(x.eff_amount))})`} /></Field>
              <div />
              <div className="full"><Field label={t("訂正理由", "Lý do sửa")} required><textarea value={form.reason ?? ""} onChange={set("reason")} required /></Field></div>
              <div className="full">
                <Field label={t("証跡（メモ）", "Bằng chứng (ghi chú)")} hint={t("※ プロトタイプではファイル添付は未実装（MOCK）。本番は Supabase Storage に保存。", "※ Prototype chưa có đính kèm file (MOCK). Bản thật lưu vào Supabase Storage.")}>
                  <input value={form.evidence_note ?? ""} onChange={set("evidence_note")} />
                </Field>
              </div>
            </div>
            <Btn disabled={a.busy}>{t("申請する", "Gửi yêu cầu")}</Btn>
          </form>
        </RoleGate>
      </Card>
    </>
  );
}
