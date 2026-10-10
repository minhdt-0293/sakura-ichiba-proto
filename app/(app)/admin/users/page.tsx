"use client";
import Link from "next/link";
import { useApi } from "@/lib/api-client";
import { useT, useEnum } from "@/lib/i18n";
import { PageHeader, Card, Table, Loading, ErrorBox, LinkBtn, dt } from "@/components/ui";

export default function Users() {
  const t = useT();
  const e = useEnum();
  const { data, error } = useApi<any[]>("/api/admin/users");
  return (
    <>
      <PageHeader id="A001" ja="アカウント一覧" vi="Danh sách tài khoản" actions={<LinkBtn href="/admin/users/new">{t("アカウント作成", "Tạo tài khoản")}</LinkBtn>} />
      <Card>
        <ErrorBox error={error} />
        {!data ? <Loading /> : (
          <Table head={[t("表示名", "Tên"), t("メール", "Email"), t("ロール", "Vai trò"), t("状態", "Trạng thái"), t("最終ログイン", "Đăng nhập gần nhất")]}>
            {data.map((u) => (
              <tr key={u.id}>
                <td><Link href={`/admin/users/${u.id}`}>{u.display_name}</Link></td>
                <td className="small">{u.email}</td>
                <td className="small">{u.roles.map((r: string) => e("role", r)).join(", ")}</td>
                <td>{u.active ? <span className="badge badge-green">{t("有効", "Hoạt động")}</span> : <span className="badge badge-red">{t("ロック", "Khóa")}</span>}</td>
                <td className="small nowrap">{dt(u.last_sign_in_at)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
