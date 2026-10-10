# LAB-2 — Phạm vi prototype Product A (桜水産市場)

Tài liệu này chốt những gì prototype làm thật, những gì để ngoài, và phần nào là mock. Nguồn là các deliverable của LAB-1: Screen List (39 màn hình), Function & Feature List (15 function, 66 feature baseline) và User Stories (20).

Quy ước trạng thái:

- **Làm thật**: có màn hình, có API route và đọc/ghi Supabase thật.
- **Gộp**: làm thật nhưng nằm chung màn hình với màn hình khác.
- **Một phần**: chạy được phần lõi, còn thiếu một phần (ghi rõ thiếu gì).
- **Mock**: có giao diện và dữ liệu, nhưng phần tích hợp hoặc xử lý thật được giả lập.
- **Ngoài phạm vi**: không làm trong LAB-2.

## 1. Danh sách màn hình (so với 39 màn hình LAB-1)

| ID | Màn hình | Đường dẫn | Trạng thái | Ghi chú |
|---|---|---|---|---|
| C001 | Đăng nhập | `/login` | Làm thật | Supabase Auth (email + mật khẩu). Middleware chặn mọi trang nếu chưa đăng nhập. |
| C002 | Trang chủ (dashboard) | `/` | Làm thật | Số liệu đọc từ DB: giao dịch hôm nay, tồn giao hàng, yêu cầu sửa chờ duyệt, tranh chấp, thao tác bị chặn. |
| C003 | Danh sách thông báo | `/notifications` | Làm thật | Thông báo trong app theo vai trò, đánh dấu đã đọc. |
| P001 | Danh sách người tham gia | `/parties` | Làm thật | Cột "được giao dịch hôm nay" tính từ 許可/承認/登録. |
| P002 | Thêm / sửa người tham gia | `/parties/new`, `/parties/[id]` | Làm thật | Đổi trạng thái bắt buộc ghi lý do, có audit. |
| P003 | Giấy phép / chấp thuận | `/parties/[id]` | Gộp | Gộp vào P002. DB chặn sai loại: 仲卸 chỉ nhận 許可, 売買参加者 chỉ nhận 承認. |
| L001 | Danh sách lot | `/lots` | Làm thật | |
| L002 | Tạo lot | `/lots/new` | Làm thật | Mã lot do hệ thống cấp, mã tạm lưu kèm. |
| L003 | Chi tiết lot | `/lots/[id]` | Làm thật | Thanh trạng thái: 受付→評価→販売中→完売. |
| L004 | Nhập kết quả đánh giá | `/lots/[id]` | Gộp | Con người đánh giá, hệ thống chỉ ghi kết quả (CAP-HUMAN-01). |
| T001 | Danh sách giao dịch | `/trades` | Làm thật | |
| T002 | Ghi giao dịch thỏa thuận (相対取引) | `/trades/aitai/new` | Làm thật | Kiểm tra tư cách bên mua và số lượng khả dụng ngay lúc chốt. |
| T003 | Chi tiết giao dịch | `/trades/[id]` | Làm thật | Có hủy, lịch sử giao hàng, delta điều chỉnh, audit. |
| T004 | Nhập kết quả đấu giá (せり) | `/trades/seri/new` | Làm thật | Màn hình đề bài gợi ý. Chỉ nhập kết quả cuối, không OCR/AI. |
| D001 | Danh sách giao hàng | `/deliveries` | Làm thật | Lọc tồn đọng / ngoại lệ / xong. |
| D002 | Ghi giao hàng | `/deliveries/[tradeId]` | Làm thật | Giao nhiều lần; tự chuyển "giao xong" khi tổng = số lượng. |
| D003 | Ghi vấn đề khi giao hàng | `/deliveries/[tradeId]` | Gộp | Gộp vào D002: thiếu / thừa / trả / hủy một phần + đóng ngoại lệ. |
| S001 | Đối soát ngày & khóa ngày | `/settlement` | Làm thật | Khóa ngày; sau khóa chặn sửa trực tiếp. |
| S002 | Chi tiết dòng đối soát | `/settlement` | Gộp | Bảng chi tiết nằm trong S001, bấm vào để sang T003. |
| S003 | Danh sách tranh chấp | `/disputes` | Làm thật | |
| S004 | Chi tiết tranh chấp | `/disputes/new`, `/disputes/[id]` | Làm thật | Mỗi lần cập nhật lưu lịch sử. |
| S005 | Xử lý dữ liệu mâu thuẫn (sau mất mạng) | — | Ngoài phạm vi | Phụ thuộc chức năng offline, mà offline nằm ngoài LAB-2 (xem mục 3). |
| S006 | Tạo yêu cầu sửa | `/corrections/new?trade=` | Làm thật | |
| S007 | Danh sách yêu cầu sửa | `/corrections` | Làm thật | |
| S008 | Duyệt yêu cầu sửa | `/corrections/[id]` | Làm thật | Người lập không tự duyệt được. Khi duyệt sinh bản ghi delta, giá trị gốc giữ nguyên. |
| R001 | Danh sách version tỷ lệ | `/rates` | Làm thật | Hiển thị số lần đã đổi trong năm (x/4). |
| R002 | Soạn / duyệt version tỷ lệ | `/rates/new`, `/rates/[id]` | Làm thật | Tách lập–duyệt, tối đa 4 lần/năm, rollback bằng bản nháp mới. |
| R003 | Tính tiền thưởng theo kỳ | `/incentives` | Một phần | Công thức là giả định (Q-05/Q-06). Dữ liệu thanh toán là mock. |
| R004 | Chi tiết tiền thưởng | `/incentives/[id]` | Làm thật | Hiện công thức từng dòng: ⌊tiền × tỷ lệ × 110/100⌋. |
| B001 | Danh sách báo cáo | `/reports` | Làm thật | Đủ 12 báo cáo của TBL-REPORT-01. |
| B002 | Xem báo cáo | `/reports/[code]` | Gộp | Gộp với B001 theo luồng; mỗi báo cáo có bộ lọc và tải CSV (JA/VI). |
| B003 | Xuất dữ liệu cho kế toán | `/export` | Mock | Chỉ xuất CSV cho ngày đã khóa (giả định Q-09). Thuế tạm tính 10%. |
| N001 | Cài đặt thông báo | `/admin/notification-settings` | Làm thật | |
| N002 | Lịch sử gửi thông báo | `/admin/notification-log` | Mock | Email không gửi thật (xem mục 3). |
| A001 | Danh sách tài khoản | `/admin/users` | Làm thật | |
| A002 | Thêm / sửa tài khoản | `/admin/users/new`, `/admin/users/[id]` | Làm thật | Tạo user Supabase Auth thật. Khóa tài khoản sẽ ban ở tầng Auth. |
| A003 | Tra cứu nhật ký thao tác | `/admin/audit` | Làm thật | Có cả thao tác **bị chặn** (result = BLOCKED). |
| A004 | Lịch ngày nghỉ của chợ | `/admin/holidays` | Một phần | Lưu và hiển thị; chưa dùng để chặn nhập liệu vào ngày nghỉ. |
| A005 | Danh mục dùng chung | `/admin/masters` | Làm thật | Không xóa vật lý; chỉ ngừng sử dụng. |

Tổng kết: 38/39 màn hình có trong prototype, trong đó 6 màn hình gộp vào màn hình khác. Màn hình duy nhất để ngoài là S005.

## 2. Tính năng (66 feature baseline của LAB-1)

| Feature | Trạng thái | Ghi chú |
|---|---|---|
| F01-01 Đăng nhập/đăng xuất, F01-04 Quản lý tài khoản, F01-05 Phân quyền | Làm thật | 7 vai trò theo TBL-ROLE-01. Quyền được kiểm tra ở API route; menu ẩn theo vai trò. |
| F01-02 MFA | Ngoài phạm vi | Cần làm thật: bật Supabase Auth MFA (TOTP) và bắt buộc cho SYS_ADMIN, người duyệt. |
| F01-03 Tự đăng xuất / khóa khi sai nhiều lần | Một phần | Phiên hết hạn theo Supabase (JWT 1 giờ, tự refresh). Khóa sau N lần sai chưa làm; Supabase chỉ có rate limit. |
| F02-01 ~ F02-05 Người tham gia, 許可, 承認, trạng thái, kiểm tra khi chốt | Làm thật | Hàm `party_block_reason()` dùng chung cho mọi lần chốt. |
| F02-06 Cảnh báo sắp hết hạn | Mock | Logic thật nhưng chạy bằng nút bấm thay cho batch (xem mục 3). |
| F02-07 Hạn mức tham gia | Làm thật | Chỉ lưu và hiển thị, không tự chặn (giả định Q-12). |
| F03-01, F03-03, F03-04, F03-05 Lot, đánh giá, trạng thái, số lượng còn | Làm thật | Ràng buộc DB `quantity_available >= 0` và khóa dòng (`for update`) để chống bán vượt khi 2 người chốt cùng lúc. |
| F03-02 Đính kèm chứng từ | Ngoài phạm vi | Cần làm thật: Supabase Storage + bảng metadata + chính sách lưu 7 năm / 3 năm. |
| F03-06 Sửa thông tin lot có kiểm soát | Ngoài phạm vi | Đánh giá lại lot đã có (ghi audit "cập nhật sau đánh giá"); sửa thuộc tính lot chưa làm. |
| F03-07 Chặn nhập trùng | Một phần | Mã lot / mã giao dịch / mã người tham gia là duy nhất; chưa có kiểm tra trùng nghiệp vụ khi import. |
| F03-08, F06-06, F07-05 Làm việc khi mất mạng | Ngoài phạm vi | Cần PWA + hàng đợi cục bộ + đồng bộ + màn hình xử lý xung đột (S005). Đây là phần rủi ro kỹ thuật lớn nhất (R-05), sẽ làm PoC riêng. |
| F04-01 ~ F04-05 相対取引 | Làm thật | |
| F05-01, F05-02 せり | Làm thật | |
| F06-01 ~ F06-05 Giao hàng | Làm thật | Giao nhiều lần không giới hạn số lần (giả định Q-08). |
| F07-01 ~ F07-04 Đối soát, khóa ngày, chặn sửa, tranh chấp | Làm thật | Không có mở khóa ngày (giả định Q-07). |
| F08-01, F08-02 Yêu cầu sửa / duyệt | Làm thật | Duyệt 1 cấp (giả định Q-07). |
| F09-01 ~ F09-04 Version tỷ lệ | Làm thật | |
| F10-01 Tính tiền thưởng | Một phần | Theo BR-INC-01. Định nghĩa "số tiền đủ điều kiện" và bậc tỷ lệ là giả định. |
| F10-02 Đưa chênh lệch sang kỳ sau | Ngoài phạm vi | Hiện tính lại thì tạo lần chạy mới (giữ lần cũ). Cần làm thật: so lần chạy mới với lần đã chốt, ghi delta vào kỳ kế tiếp. |
| F11-01 ~ F11-03 Báo cáo + CSV | Làm thật | 12/12 báo cáo, tính trực tiếp từ DB khi mở (chưa có batch trước 11:00). |
| F11-04 Xuất cho kế toán | Mock | Chỉ có CSV. |
| F12-01 ~ F12-04 Thông báo | Mock | Thông báo trong app là thật; email giả lập. |
| F13-01 ~ F13-03 Audit | Làm thật | Có trước/sau, người làm, lý do, kết quả OK/BLOCKED. Tiền thưởng hiển thị version tỷ lệ đã dùng. |
| F14-01 Lịch nghỉ, F14-02 Danh mục | Làm thật | Lịch nghỉ chưa chặn nhập (xem A004). |
| F14-03 Theo dõi lỗi & cảnh báo vận hành | Ngoài phạm vi | Cần làm thật: Sentry / log của Vercel, cảnh báo cron. |
| F14-04 Lưu trữ chứng từ dài hạn | Ngoài phạm vi | Đi cùng F03-02. |
| F14-05 Xuất dữ liệu cá nhân | Ngoài phạm vi | |
| F15-01 ~ F15-04 Công cụ chuyển đổi dữ liệu | Ngoài phạm vi | Dữ liệu demo được đổ bằng `02_seed.sql`. Công cụ migration thật thuộc giai đoạn sau (cần fixture CSV, Q-01/Q-11). |
| OPT-A ~ OPT-E | Ngoài phạm vi | Đây là các option báo giá riêng, không thuộc baseline. |

## 3. Phần được mock: vì sao mock, và làm thật thì cần gì

| Phần mock | Hiện tại | Vì sao mock | Nếu làm thật cần |
|---|---|---|---|
| Dữ liệu nghiệp vụ | `02_seed.sql` đổ khoảng 16 người tham gia, khoảng 35 lot, khoảng 55 giao dịch trong 7 ngày gần nhất; ngày tính theo "hôm nay" | Đề bài yêu cầu không dùng dữ liệu thật | Công cụ migration (F15), fixture CSV của khách (Q-01), quy tắc làm sạch dữ liệu |
| Thanh toán (dữ liệu tính thưởng) | Bảng `payments` đổ sẵn: hạn trả, ngày trả, số tiền | Thanh toán / ngân hàng nằm ngoài phạm vi (01-04) | Nguồn dữ liệu thanh toán từ kế toán hoặc nhập tay có duyệt; xác nhận định nghĩa hạn trả (Q-05) |
| Công thức 完納奨励金 | ⌊số tiền trả trong hạn × tỷ lệ bậc × 110/100⌋; trễ hoặc chưa trả = 0 | RFP chưa đủ định nghĩa (Q-05, Q-06); thiếu test vector Phụ lục C | Câu trả lời Q-05/Q-06, test vector INC-EDGE-01..03, unit test |
| Email thông báo | Ghi vào bảng `notifications` với channel = EMAIL, không gửi. Địa chỉ chứa "fail" giả lập lỗi: thử lại 3 lần rồi bật cờ cảnh báo vận hành | Không tích hợp bên thứ ba ở LAB-2 | Dịch vụ email (Resend / SendGrid / SES), hàng đợi retry, xác thực domain (SPF/DKIM) |
| Batch định kỳ (cảnh báo hết hạn, tồn giao hàng, quá hạn tranh chấp) | Nút "通知チェックを実行" gọi hàm `run_notification_checks()` | Không cần hạ tầng job cho demo | Vercel Cron hoặc Supabase pg_cron gọi cùng hàm; ghi log chạy batch |
| Liên kết kế toán | CSV tải từ màn hình, chỉ cho ngày đã khóa. Thuế tạm 10% | Phương thức chưa chốt (08-03, Q-09) | Spec file / API của hệ thống kế toán, môi trường test, xác nhận thuế suất (8% hay 10%) |
| Đính kèm bằng chứng | Chỉ có ô ghi chú dạng text | Không thuộc lõi demo | Supabase Storage, giới hạn dung lượng, chính sách lưu trữ |
| Ngày nghiệp vụ | Lấy theo ngày lịch JST | Khung giờ chuyển ngày chưa chốt (Q-17) | Quy tắc chuyển ngày (ví dụ thao tác sau 10:00 tính ngày nào), lịch nghỉ chặn nhập |

## 4. Giả định nghiệp vụ dùng trong prototype (lấy từ QA List LAB-1)

- **Q-02**: bên bán là 卸売業者; bên mua là 仲卸, 売買参加者 hoặc 買出人.
- **Q-03**: người ngoài chợ không có tài khoản. Toàn bộ người dùng là nhân viên chợ, gồm 7 vai trò.
- **Q-07**: duyệt sửa 1 cấp do bộ phận đối soát; người lập ≠ người duyệt; không mở khóa ngày.
- **Q-08**: giao nhiều lần không giới hạn; giao đủ thì hoàn tất.
- **Q-09**: kế toán nhận CSV xuất tay sau khi khóa ngày.
- **Q-12**: hạn mức tham gia chỉ hiển thị, không tự chặn.
- **Q-20**: rollback tỷ lệ bằng cách tạo bản nháp mới có cùng nội dung; không tính lại các kỳ đã chốt.

## 5. Phân quyền (ma trận rút gọn)

Mọi người đã đăng nhập đều xem được dữ liệu nghiệp vụ, trừ audit log (xem mục RLS bên dưới). Quyền ghi theo vai trò:

| Thao tác | Vai trò được phép |
|---|---|
| Tạo lot | INTAKE |
| Ghi đánh giá | JUDGE |
| Công khai lot | INTAKE, TRADE |
| Chốt 相対取引 / ghi せり / hủy | TRADE |
| Ghi giao hàng | DELIVERY |
| Khóa ngày, tính thưởng, xuất kế toán | SETTLEMENT |
| Lập yêu cầu sửa | TRADE, DELIVERY, SETTLEMENT |
| Duyệt yêu cầu sửa | SETTLEMENT (khác người lập) |
| Soạn version tỷ lệ | RULE_ADMIN |
| Duyệt version tỷ lệ | RULE_ADMIN, SETTLEMENT (khác người lập) |
| Người tham gia | SYS_ADMIN, SETTLEMENT |
| Tài khoản, lịch nghỉ, danh mục, cài đặt thông báo | SYS_ADMIN |
| Xem audit log | SYS_ADMIN, SETTLEMENT |

**RLS (Row Level Security)** được bật trên mọi bảng:

- Người dùng đã đăng nhập chỉ có quyền SELECT; người lạ (anon) không đọc được gì.
- Không có policy ghi. Mọi thao tác ghi bắt buộc đi qua Next.js API route: route kiểm tra vai trò rồi dùng service role.
- `audit_logs` chỉ cho SYS_ADMIN và SETTLEMENT đọc.
