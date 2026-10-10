# Ghi chú làm việc với AI — LAB-2

Code prototype do Claude (Cowork) sinh phần lớn. Mỗi lần sinh xong đều kiểm tra lại bằng 4 cách:

1. Chạy SQL trên Postgres local.
2. Dựng môi trường Supabase thu nhỏ: Postgres + PostgREST + Supabase Auth (GoTrue) + proxy.
3. Chạy `next build` để kiểm tra kiểu và build.
4. Test trình duyệt tự động bằng Playwright:
   - smoke test mở 47 màn hình;
   - 25 bước kịch bản nghiệp vụ chạy với nhiều vai trò.

## Chỗ AI sinh sai và cách phát hiện / sửa

| # | AI sinh sai | Phát hiện bằng | Đã sửa |
|---|---|---|---|
| 1 | Ghi audit "thao tác bị chặn" ngay **trong** hàm DB rồi mới `RAISE EXCEPTION`. Exception rollback luôn bản ghi audit, nên thực tế không có log nào. | Test trực tiếp bằng SQL: sau 5 lần bị chặn, đếm `audit_logs where result='BLOCKED'` = 0 | Bỏ phần ghi audit trong hàm. API route bắt lỗi, rồi ghi audit `BLOCKED` bằng một lệnh riêng (transaction riêng). |
| 2 | Seed dùng `random()` trong `WHERE code = (array[...])[random]`. Postgres tính lại `random()` cho từng dòng, nên có lúc không khớp dòng nào và lỗi `NOT_WHOLESALER`. | Chạy seed bị lỗi | Tính giá trị ngẫu nhiên vào biến trước, rồi mới dùng trong `WHERE`. |
| 3 | `UNION ALL` giữa chuỗi uuid và cột uuid bị lỗi kiểu dữ liệu. | Chạy seed bị lỗi | Ép kiểu `::uuid`. |
| 4 | Phân quyền mặc định vẫn để `TRUNCATE/REFERENCES/TRIGGER` cho `anon`/`authenticated`. | Kiểm tra `information_schema.role_table_grants` | Thu hồi toàn bộ quyền ghi, chỉ để `SELECT` cho `authenticated`. |
| 5 | RLS cho mọi người đã đăng nhập đọc `audit_logs` qua REST trực tiếp (bỏ qua kiểm tra quyền ở API). | Review bảo mật, sau đó gọi REST bằng token của `trade` | Thêm policy riêng: chỉ SYS_ADMIN/SETTLEMENT đọc được. Đã xác nhận `trade` nhận `[]`. |
| 6 | Export hằng số `SELECT_TRADE` từ file `route.ts`. Next.js không cho file route export tên ngoài GET/POST… | Review theo quy tắc Next.js trước khi build | Chuyển hằng số sang `lib/selects.ts`. |
| 7 | Số âm hiển thị `¥-12,000`. | Xem ảnh chụp màn hình S008 | Sửa hàm format thành `-¥12,000`. |
| 8 | Test ban đầu báo FAIL do đọc màn hình trước khi dữ liệu tải lại xong, không phải lỗi app. | Đối chiếu bằng API | Sửa test, kiểm tra trạng thái qua API sau `networkidle`. |
| 9 | Môi trường local thiếu CORS (Supabase thật có sẵn), nên đăng nhập từ trình duyệt lỗi. | Log console của Playwright | Chỉ sửa proxy local, không đổi code app. |

## Điểm còn là giả định (cần người duyệt)

- Công thức tiền thưởng (Q-05, Q-06): dùng "số tiền trả trong hạn" và bảng tỷ lệ bậc thang tự đặt.
- Thuế 10% trong CSV kế toán. Thực phẩm có thể áp thuế suất giảm 8%.
- Ma trận quyền (ai được sửa người tham gia, ai được duyệt tỷ lệ): tự đề xuất, RFP chưa chốt.
