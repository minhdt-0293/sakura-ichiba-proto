# Hướng dẫn deploy (Supabase + GitHub + Vercel)

Thời gian khoảng 30 phút. Không cần cài gì trên máy nếu dùng cách upload qua giao diện web. Tên nút trên giao diện Supabase/Vercel có thể khác đôi chút tùy phiên bản.

## Bước 1 — Tạo database trên Supabase

1. Vào https://supabase.com, đăng nhập rồi bấm **New project**.
   - Name: `sakura-ichiba-proto`
   - Database password: tự đặt và lưu lại
   - Region: **Northeast Asia (Tokyo)**
2. Đợi project khởi tạo xong (1–2 phút).
3. Mở **SQL Editor** → **New query**. Dán **toàn bộ** nội dung `supabase/01_schema.sql` rồi bấm **Run**. Kết quả không được có thông báo lỗi màu đỏ.
4. Mở thêm một query mới, dán toàn bộ `supabase/02_seed.sql` rồi bấm **Run**. Bước này tạo 7 tài khoản demo và dữ liệu mẫu.
   - Muốn reset dữ liệu demo về ban đầu thì chạy lại file này bất cứ lúc nào.
5. Kiểm tra:
   - **Table Editor** phải thấy các bảng `parties`, `lots`, `trades`…
   - **Authentication → Users** phải thấy 7 user `…@demo.sakura-ichiba.example`.
6. Lấy 3 giá trị ở **Project Settings → API Keys** (với project cũ là **Project Settings → API**):

| Biến môi trường | Lấy ở đâu |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL, dạng `https://xxxx.supabase.co` (nút **Connect** hoặc Settings → Data API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Key `anon` (tab "Legacy API keys") hoặc publishable key `sb_publishable_…` |
| `SUPABASE_SERVICE_ROLE_KEY` | Key `service_role` (tab "Legacy API keys") hoặc secret key `sb_secret_…` — **tuyệt đối không công khai** |

> Khuyến nghị dùng cặp **legacy** `anon` / `service_role`, vì đây là cặp đã được kiểm thử với code.

## Bước 2 — Đưa code lên GitHub

**Cách A — giao diện web, không cần git:**

1. Trên GitHub bấm **New repository**. Đặt tên `sakura-ichiba-proto`, chọn Private hoặc Public, **không** tick "Add README".
2. Giải nén file zip. Trong repo mới bấm **uploading an existing file**, rồi kéo thả toàn bộ nội dung bên trong thư mục `sakura-ichiba-proto` (gồm `app/`, `components/`, `lib/`, `supabase/`, `docs/`, `package.json`…). Không kéo file `.env.local` nếu có.
3. Bấm **Commit changes**.

> Lưu ý: GitHub web có thể bỏ qua file bắt đầu bằng dấu chấm (`.gitignore`, `.env.example`). Chuyện này không ảnh hưởng tới việc deploy.

**Cách B — dùng git (nếu máy có git):**

```bash
cd sakura-ichiba-proto
git init && git add . && git commit -m "LAB-2 prototype"
git branch -M main
git remote add origin https://github.com/<tài-khoản>/sakura-ichiba-proto.git
git push -u origin main
```

## Bước 3 — Deploy lên Vercel

1. Vào https://vercel.com, đăng nhập bằng GitHub, bấm **Add New… → Project** rồi **Import** repo `sakura-ichiba-proto`.
2. Framework Preset sẽ tự nhận là **Next.js**. Giữ nguyên Build Command và Output.
3. Mở **Environment Variables** và thêm đủ 3 biến ở Bước 1.6.
4. Bấm **Deploy** và đợi khoảng 1–2 phút.
5. Mở URL Vercel cấp (dạng `https://sakura-ichiba-proto.vercel.app`).
   - Trình duyệt phải tự chuyển sang `/login`.
   - Đăng nhập `admin@demo.sakura-ichiba.example` / `Demo@2026`.

> Nếu đã deploy rồi mới thêm hoặc sửa biến môi trường: vào **Deployments → … → Redeploy**.

## Bước 4 — Cấu hình phụ (khuyến nghị)

- Supabase → **Authentication → URL Configuration** → **Site URL**: điền URL Vercel. Đăng nhập bằng mật khẩu không bắt buộc bước này, nhưng nên đặt cho đúng.
- Supabase → **Authentication → Sign In / Providers → Email**: tắt **Allow new users to sign up**, để người lạ không tự tạo tài khoản qua API. Tài khoản mới tạo ở màn hình A002 bằng service role.
- Điền URL Vercel vào `README.md`, mục "URL demo".

## Kiểm tra nhanh sau deploy

1. Mở URL ở cửa sổ ẩn danh → phải bị chuyển về `/login`. Mở `/api/trades` → phải trả `{"error":"UNAUTHORIZED"}`.
2. Đăng nhập `trade@…` → **相対取引入力** → chọn bên mua `N-104` → **確定**. Phải báo lỗi "không có 許可 còn hiệu lực".
3. Đăng nhập `admin@…` → **操作ログ**, lọc BLOCKED → phải thấy lần bị chặn ở bước 2.

## Lỗi thường gặp

| Hiện tượng | Nguyên nhân / cách sửa |
|---|---|
| Đăng nhập báo sai mật khẩu dù nhập đúng | Chưa chạy `02_seed.sql`, hoặc chạy lỗi giữa chừng. Chạy lại file seed. |
| Đăng nhập xong màn hình báo "セッションが無効です" | Thiếu bản ghi `app_users` (seed lỗi), hoặc sai `SUPABASE_SERVICE_ROLE_KEY` trên Vercel. |
| Mọi trang báo `SERVER_ERROR` | Sai hoặc thiếu biến môi trường. Kiểm tra lại 3 biến rồi Redeploy. |
| Lỗi `Could not find a relationship…` | Cache schema của Supabase chưa làm mới. Chạy lệnh `notify pgrst, 'reload schema';` trong SQL Editor. |
| Lỗi `permission denied for function …` | `01_schema.sql` chưa chạy hết. Chạy lại toàn bộ file (file chạy lại được nhiều lần). |
