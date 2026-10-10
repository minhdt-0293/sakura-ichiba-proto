"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import { api, useApi } from "@/lib/api-client";
import { useT } from "@/lib/i18n";
import { PageHeader, Card, useAction, ActionResult, Loading, ErrorBox } from "@/components/ui";
import { UserForm } from "@/components/user-form";

export default function EditUser({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const router = useRouter();
  const a = useAction();
  const { data, error } = useApi<any[]>("/api/admin/users");
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  const u = data.find((x) => x.id === id);
  if (!u) return <ErrorBox error={{ code: "NOT_FOUND" }} />;
  return (
    <>
      <PageHeader id="A002" ja={`アカウント編集：${u.display_name}`} vi={`Sửa tài khoản: ${u.display_name}`} back="/admin/users" />
      <Card>
        <p className="small muted">{t("ロール変更・ロック・パスワード再設定は操作ログに記録されます。", "Đổi vai trò, khóa, đặt lại mật khẩu đều được ghi log thao tác.")}</p>
        <ActionResult a={a} />
        <UserForm initial={{ ...u, password: "" }} isNew={false} busy={a.busy}
          onSubmit={(v) => a.run(async () => { await api(`/api/admin/users/${id}`, { method: "PUT", body: v }); router.push("/admin/users"); })} />
      </Card>
    </>
  );
}
