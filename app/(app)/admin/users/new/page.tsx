"use client";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { PageHeader, Card, useAction, ActionResult } from "@/components/ui";
import { UserForm } from "@/components/user-form";

export default function NewUser() {
  const router = useRouter();
  const a = useAction();
  return (
    <>
      <PageHeader id="A002" ja="アカウント作成" vi="Tạo tài khoản" back="/admin/users" />
      <Card>
        <ActionResult a={a} />
        <UserForm initial={{}} isNew busy={a.busy} onSubmit={(v) => a.run(async () => { await api("/api/admin/users", { body: v }); router.push("/admin/users"); })} />
      </Card>
    </>
  );
}
