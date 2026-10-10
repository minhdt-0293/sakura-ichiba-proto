"use client";
import { useT } from "@/lib/i18n";
import { Btn } from "./ui";

export type Tier = { min_amount: number | string; rate: number | string };

/** Nhập bậc tỷ lệ: tỷ lệ hiển thị theo %, lưu dạng số thập phân */
export function TierEditor({ tiers, onChange }: { tiers: Tier[]; onChange: (t: Tier[]) => void }) {
  const t = useT();
  const upd = (i: number, k: keyof Tier, v: string) => onChange(tiers.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <div>
      <table>
        <thead><tr><th>{t("対象金額（以上・円）", "Số tiền đủ ĐK từ (¥)")}</th><th>{t("料率（%）", "Tỷ lệ (%)")}</th><th /></tr></thead>
        <tbody>
          {tiers.map((x, i) => (
            <tr key={i}>
              <td><input type="number" min={0} value={x.min_amount} onChange={(e) => upd(i, "min_amount", e.target.value)} required /></td>
              <td><input type="number" min={0} max={99} step={0.01} value={x.rate} onChange={(e) => upd(i, "rate", e.target.value)} required /></td>
              <td><Btn type="button" kind="ghost" onClick={() => onChange(tiers.filter((_, j) => j !== i))}>✕</Btn></td>
            </tr>
          ))}
        </tbody>
      </table>
      <Btn type="button" kind="secondary" onClick={() => onChange([...tiers, { min_amount: "", rate: "" }])} style={{ marginTop: 8 }}>+ {t("段階を追加", "Thêm bậc")}</Btn>
    </div>
  );
}

export const toPayload = (tiers: Tier[]) => tiers.map((x) => ({ min_amount: Number(x.min_amount), rate: Math.round(Number(x.rate) * 100) / 10000 }));
export const fromRows = (rows: { min_amount: number; rate: number }[]) => rows.map((r) => ({ min_amount: r.min_amount, rate: Math.round(Number(r.rate) * 10000) / 100 }));
