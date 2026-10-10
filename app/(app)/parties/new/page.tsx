"use client";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { PageHeader, Card, useAction, ActionResult, useMe, RoleGate } from "@/components/ui";
import { PartyForm } from "@/components/party-form";
import { can } from "@/lib/roles";

export default function NewParty() {
  const router = useRouter();
  const a = useAction();
  const me = useMe();
  return (
    <>
      <PageHeader id="P002" ja="参加者の登録" vi="Thêm người tham gia" back="/parties" />
      <Card>
        <RoleGate ok={can(me?.roles, "partyWrite")}>
          <ActionResult a={a} />
          <PartyForm initial={{}} isNew busy={a.busy} onSubmit={(v) => a.run(async () => {
            const p = await api<any>("/api/parties", { body: v });
            router.push(`/parties/${p.id}`);
          })} />
        </RoleGate>
      </Card>
    </>
  );
}
