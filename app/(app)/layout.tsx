import { Shell } from "@/components/shell";

// Mọi màn hình sau đăng nhập đều render động (dữ liệu theo phiên người dùng)
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
