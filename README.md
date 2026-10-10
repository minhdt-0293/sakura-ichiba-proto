# 桜水産市場 業務支援システム — Prototype (LAB-2, Product A)

Prototype chạy thật của hệ thống hỗ trợ nghiệp vụ chợ bán buôn thủy sản (RFP PRODUCT-A-RFP-JA-V1.0-RC7).

- **Stack:** Next.js 15 (App Router) · Supabase (Postgres + Auth) · Vercel
- **Giao diện:** song ngữ 日本語 / Tiếng Việt, đổi bằng nút ở góc phải trên
- **Dữ liệu:** toàn bộ là mock (hư cấu), đổ sẵn bằng `supabase/02_seed.sql`

## URL demo

`https://<điền-sau-khi-deploy>.vercel.app`

## Tài khoản demo (dành cho giảng viên)

Mật khẩu chung: **`Demo@2026`**

| Email | Vai trò | Dùng để thử |
|---|---|---|
| `admin@demo.sakura-ichiba.example` | Quản trị hệ thống (có đủ mọi vai trò) | Xem toàn bộ, tài khoản, audit log, duyệt version tỷ lệ |
| `intake@demo.sakura-ichiba.example` | Tiếp nhận lot + ghi đánh giá | L002 tạo lot → L004 ghi đánh giá → công khai |
| `trade@demo.sakura-ichiba.example` | Giao dịch | T002 相対取引, T004 nhập kết quả せり, hủy giao dịch |
| `delivery@demo.sakura-ichiba.example` | Giao hàng | D002 giao nhiều lần, D003 ngoại lệ |
| `settle@demo.sakura-ichiba.example` | Đối soát | S001 khóa ngày, R003 tính thưởng, B003 xuất kế toán |
| `settle2@demo.sakura-ichiba.example` | Đối soát (người duyệt thứ 2) | S008 duyệt yêu cầu sửa do `settle` lập |
| `rule@demo.sakura-ichiba.example` | Quản trị quy định | R002 soạn version tỷ lệ (người khác duyệt) |

> Dữ liệu mẫu được tính lùi theo ngày chạy seed (7 ngày gần nhất). Trước buổi demo nên chạy lại `supabase/02_seed.sql` trong Supabase SQL Editor để dữ liệu "hôm nay" luôn mới.

## Kịch bản demo gợi ý (khoảng 10 phút)

1. Mở URL khi chưa đăng nhập → bị chuyển về `/login`. `/api/*` trả 401.
2. **trade** → 相対取引入力 → chọn bên mua `N-104` (許可 đã hết hạn) → bị chặn. Chọn `B-203` (承認 bị tạm ngừng) → bị chặn. Hai lỗi khác nhau vì 許可 và 承認 được quản lý tách riêng.
3. **trade** → nhập số lượng lớn hơn số còn lại của lot → bị chặn (chống bán vượt).
4. **trade** → nhập kết quả せり: chỉ nhập kết quả cuối, kèm người xác nhận, không có OCR/AI.
5. **delivery** → giao một phần → giao nốt → trạng thái tự chuyển "giao xong".
6. **settle** → mở một giao dịch → yêu cầu sửa → tự duyệt → bị chặn (tách lập–duyệt). Sau đó **settle2** duyệt → giá trị gốc giữ nguyên, có thêm bản ghi delta.
7. **settle** → S001 khóa ngày → **trade** hủy giao dịch của ngày đó → bị chặn.
8. **settle** → R003 tính 完納奨励金 → R004 hiện công thức từng dòng; trả trễ = 0.
9. **admin** → 操作ログ, lọc BLOCKED → thấy toàn bộ các lần bị chặn ở trên.

## Tài liệu

- [`docs/SCOPE.md`](docs/SCOPE.md) — chốt phạm vi: màn hình làm / gộp / để ngoài so với LAB-1, phần mock và việc cần làm nếu làm thật, ma trận quyền.
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — hướng dẫn deploy Supabase → GitHub → Vercel từng bước.
- [`docs/AI-NOTES.md`](docs/AI-NOTES.md) — các chỗ AI sinh code sai và cách phát hiện / sửa.

## Kiến trúc tóm tắt

```
Trình duyệt (React client components, song ngữ)
   │  fetch /api/...  (cookie phiên Supabase)
   ▼
Next.js middleware ── chặn mọi trang nếu chưa đăng nhập
   ▼
Next.js API routes (app/api/**) ── kiểm tra đăng nhập + vai trò (lib/roles.ts)
   │  supabase-js với service role (chỉ ở server)
   ▼
Supabase Postgres
   ├─ Bảng + RLS (authenticated chỉ đọc; anon không đọc được gì)
   └─ Hàm nghiệp vụ plpgsql (confirm_trade, record_delivery, lock_business_day,
      review_correction, review_rate_version, run_incentive, …) — chạy trong transaction
```

- Quy tắc nghiệp vụ quan trọng nằm trong hàm DB, để 2 người thao tác cùng lúc vẫn đúng: khóa dòng, ràng buộc số lượng không âm.
- Mọi thao tác ghi đều để lại audit log có trước/sau. Thao tác bị chặn được API ghi riêng với `result = BLOCKED`.

## Chạy trên máy (tùy chọn)

```bash
cp .env.example .env.local   # điền 3 biến Supabase
npm install
npm run dev                  # http://localhost:3001
```
