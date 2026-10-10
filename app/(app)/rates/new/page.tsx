"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, Field, Btn, useAction, ActionResult, useMe, RoleGate } from "@/components/ui";
import { TierEditor, toPayload, Tier } from "@/components/tier-editor";
import { can } from "@/lib/roles";

export default function NewRate() {
  const t = useT();
  const me = useMe();
  const router = useRouter();
  const a = useAction();
  const [eff, setEff] = useState("");
  const [note, setNote] = useState("");
  const [tiers, setTiers] = useState<Tier[]>([{ min_amount: 0, rate: "" }]);
  return (
    <>
      <PageHeader id="R002" ja="料率版の起票" vi="Soạn version tỷ lệ" back="/rates" />
      <Card>
        <RoleGate ok={can(me?.roles, "rateDraft")}>
          <ActionResult a={a} />
          <form onSubmit={(e) => { e.preventDefault(); a.run(async () => { const v = await api<any>("/api/rates", { body: { effective_from: eff, note, tiers: toPayload(tiers) } }); router.push(`/rates/${v.id}`); }); }}>
            <div className="form-grid">
              <Field label={t("発効日", "Ngày hiệu lực")} required><input type="date" min={me?.today} value={eff} onChange={(e) => setEff(e.target.value)} required /></Field>
              <Field label={t("備考", "Ghi chú")}><input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            </div>
            <TierEditor tiers={tiers} onChange={setTiers} />
            <p className="small muted">{t("下書きとして保存されます。別の担当者が承認するまで適用されません。", "Lưu dưới dạng bản nháp; chưa có hiệu lực cho tới khi người khác duyệt.")}</p>
            <Btn disabled={a.busy}>{t("下書き保存", "Lưu nháp")}</Btn>
          </form>
        </RoleGate>
      </Card>
    </>
  );
}
