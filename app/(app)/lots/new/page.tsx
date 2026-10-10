"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Field, Btn, useAction, ActionResult, useMe, RoleGate } from "@/components/ui";
import { useLookups } from "@/components/lookups";
import { can } from "@/lib/roles";

export default function NewLot() {
  const t = useT();
  const me = useMe();
  const router = useRouter();
  const lk = useLookups();
  const a = useAction();
  const [v, setV] = useState<any>({ biz_date: me?.today, unit: "KG" });
  const set = (k: string) => (e: any) => setV({ ...v, [k]: e.target.value });
  return (
    <>
      <PageHeader id="L002" ja="ロット受付" vi="Tiếp nhận lot" back="/lots" />
      <Card>
        <RoleGate ok={can(me?.roles, "lotCreate")}>
          <p className="small muted">{t("ロット番号はシステムが自動採番します。仮番号（現場の札番号）は属性として保持します（前提 Q-15）。", "Mã lot do hệ thống tự cấp. Mã tạm (số thẻ tại hiện trường) được lưu kèm (giả định Q-15).")}</p>
          <ActionResult a={a} />
          <form onSubmit={(e) => { e.preventDefault(); a.run(async () => { const l = await api<any>("/api/lots", { body: v }); router.push(`/lots/${l.id}`); }); }}>
            <div className="form-grid">
              <Field label={t("業務日", "Ngày nghiệp vụ")} required><input type="date" value={v.biz_date ?? ""} onChange={set("biz_date")} required /></Field>
              <Field label={t("卸売業者", "Đơn vị bán buôn")} required>
                <select value={v.wholesaler_id ?? ""} onChange={set("wholesaler_id")} required>
                  <option value="" />
                  {lk.parties.filter((p) => p.kind === "WHOLESALER").map((p) => <option key={p.id} value={p.id}>{p.code} {p.name}</option>)}
                </select>
              </Field>
              <Field label={t("品目", "Mặt hàng")} required>
                <select value={v.item_code ?? ""} onChange={set("item_code")} required>
                  <option value="" />
                  {lk.masters("ITEM").map((m) => <option key={m.code} value={m.code}>{m.label}</option>)}
                </select>
              </Field>
              <Field label={t("数量", "Số lượng")} required>
                <div className="row" style={{ flexWrap: "nowrap" }}>
                  <input type="number" min={0.1} step={0.1} value={v.quantity ?? ""} onChange={set("quantity")} required />
                  <select value={v.unit} onChange={set("unit")} style={{ width: 110 }}>
                    {lk.masters("UNIT").map((m) => <option key={m.code} value={m.code}>{m.label}</option>)}
                  </select>
                </div>
              </Field>
              <Field label={t("産地", "Xuất xứ")}><input value={v.origin ?? ""} onChange={set("origin")} /></Field>
              <Field label={t("船名・荷主", "Tàu / chủ hàng")}><input value={v.vessel ?? ""} onChange={set("vessel")} /></Field>
              <Field label={t("仮番号（札）", "Mã tạm (thẻ)")}><input value={v.temp_no ?? ""} onChange={set("temp_no")} /></Field>
              <Field label={t("備考", "Ghi chú")}><input value={v.note ?? ""} onChange={set("note")} /></Field>
            </div>
            <Btn disabled={a.busy}>{t("受付登録", "Ghi tiếp nhận")}</Btn>
          </form>
        </RoleGate>
      </Card>
    </>
  );
}
