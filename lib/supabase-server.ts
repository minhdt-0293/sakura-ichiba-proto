import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Client gắn với phiên đăng nhập của người dùng (đọc cookie). */
export async function sessionClient() {
  const store = await cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* gọi từ Server Component: bỏ qua, middleware sẽ refresh */
        }
      },
    },
  });
}

let _admin: SupabaseClient | null = null;
/** Client service role — CHỈ dùng trong API route sau khi đã kiểm tra quyền. */
export function adminClient() {
  if (!_admin) {
    if (!SERVICE) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    _admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return _admin;
}
