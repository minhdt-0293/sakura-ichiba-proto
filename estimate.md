# estimate — Product A (桜水産市場)

> Backlog: 146 task lá trên GitHub Project https://github.com/users/minhdt-0293/projects/2 (field `SWP`, `Hours`).
> Điểm và giờ ghi ở task lá; issue cha và epic lấy tổng (task-breakdown.md §1).

## 1. Report của skill estimate-swp

| Lần chạy | File (thư mục `swp-report/`) | Đầu vào | Tổng SWP | Dùng? |
|---|---|---|---|---|
| 1 | `estimate-swp-lab5-backlog-20261023-2053.html` | backlog-list.md + spec LAB-4 **v1** | 629 | Không — chấm trên spec cũ |
| 2 | `estimate-swp-lab5-backlog-20261023-2117.html` | như lần 1 | 636 | Không — vẫn spec v1 |
| 3 | `estimate-swp-lab5-backlog-drive-v2-20261023-2132.html` | backlog-list.md + spec LAB-4 **v2** (Google Drive) | 629 | **Có** |

Lần 3: mức xử lý `medium` (một người chấm, không có người chấm đối chiếu). Độ tin cậy: 5 high · 120 medium · 21 low.
5 task đại diện để hiệu chỉnh (E01-01a, E02-04b, E02-05, E03-04b, E13-03a) được chấp nhận không sửa.
Cách phát hiện lần 1–2 sai đầu vào: lý do chấm của skill nhắc tới tên chỉ có ở spec v1 (`rule_versions`, `UNDER_REVIEW`…), không có tên của v2 (`rate_versions`, `ops_setting_versions`). Chi tiết ở AI-report.md.

## 2. Review của PL

PL review 40 task: 19 task SWP ≥ 8 và 21 task độ tin cậy low (danh sách ở `swp-report/swp-review.md`). **Không sửa điểm task nào.** Bảng mẫu:

| Issue | Task | Scope × Complexity | SWP skill | Conf. | Căn cứ của skill (tóm tắt) | PL |
|---|---|---|---|---|---|---|---|
| #40 | E02-05 Áp Role_Matrix ở API và giao diện | 8 × 2 | 12 | medium | Áp ma trận 7 vai trò lên 40 màn hình và 55 API, kiểm tra người lập ≠ người duyệt trong hàm DB | Giữ 12 |
| #38 | E02-04b Migration roles text[] → user_roles + API ADM-2 | 5 × 3 | 10 | medium | Chuyển `roles text[]` sang bảng `user_roles`, API ADM-2 cấp / thu hồi quyền, reset MFA | Giữ 10 |
| #42 | E03-01 Migration DB tư cách: trạng thái mới, events, requests | 5 × 3 | 10 | medium | Trạng thái tư cách mới, 2 bảng mới, chuyển dữ liệu 2 lớp tạm ngừng của prototype | Giữ 10 |
| #115 | E08-02a Delta, ngày ghi nhận, cập nhật lot / giao hàng | 5 × 3 | 10 | medium | Duyệt sửa giao dịch ghi delta, ngày ghi nhận, tính lại lot / giao hàng / thưởng, chặn kỳ đã FINAL | Giữ 10 |
| #162 | E10-06 Xuất CSV kế toán | 5 × 3 | 10 | medium | Xuất CSV kế toán (IF-ACC-01), chỉ ngày đã khóa, 1 batch / ngày, tải lại bằng signed URL | Giữ 10 |
| #147 | E10-02b Hiện thực + test | 3 × 3 | 6 | low | Job pg_cron dựng báo cáo ngày, SLA 11:00 với 1.200 giao dịch / ngày; spec chưa viết | Giữ 6 |
| #188 | E13-04 Xuất dữ liệu cá nhân theo yêu cầu (APPI) | 3 × 2 | 5 | low | Xuất dữ liệu cá nhân theo yêu cầu, có che dữ liệu; chưa có API / hàm / màn hình | Giữ 5 |
| #128 | E09-06b API nhập CSV thanh toán (LAB-4 chưa có) | 3 × 2 | 5 | low | Import CSV thanh toán; định dạng và nguồn chưa rõ (Q-05). Task đang Blocked | Giữ 5 |

Ghi chú: các task low phần lớn thiếu đặc tả trường báo cáo (chờ E10-01) hoặc chờ khách trả lời (Q-05). Điểm sẽ chấm lại khi sub-issue SPEC tương ứng xong.

## 3. Quy đổi SWP → giờ

**1 SWP = 4 giờ** (PREMISE.md A-05). Tổng **629 SWP = 2,516 h** ≈ 359 man-day ≈ 18.0 MM (7 h / ngày, 20 ngày / tháng như LAB-1).

| Phương án đã cân nhắc | h / SWP | Tổng giờ | Căn cứ |
|---|---|---|---|
| Theo LAB-1 | 6.8 | 4,284 | LAB-1 01_Server, phần dev BE + FE (Implement + FixBug + UT), bỏ F15 và Design, chưa buffer: 612.0 man-day × 7 h ÷ 629 SWP |
| **Chốt** | **4** | **2,516** | PL đánh giá theo kinh nghiệm, có tính hiệu quả khi dùng AI. Thấp hơn LAB-1 khoảng 41% |

Mức giảm so với LAB-1 là **giả định, chưa có số liệu đo**. Kiểm chứng ở LAB-6: so giờ thực tế với `Hours` theo từng sprint. Nếu lệch nhiều thì đổi hệ số và chạy lại `lab5/update_fields.py`.

## 4. Tổng theo epic

| Epic | Tên | Task lá | SWP | Hours | Blocked (SWP) |
|---|---|---|---|---|---|
| #1 E01 | Nền tảng & khung kỹ thuật | 10 | 42 | 168 | — |
| #2 E02 | Xác thực & phân quyền | 11 | 56 | 224 | — |
| #3 E03 | Người tham gia & tư cách 許可 / 承認 / 登録 | 16 | 73 | 292 | — |
| #4 E04 | Lot | 12 | 52 | 208 | — |
| #5 E05 | Giao dịch 相対取引 / せり | 12 | 53 | 212 | — |
| #6 E06 | Giao hàng | 6 | 28 | 112 | — |
| #7 E07 | Đối soát ngày, khóa / mở lại ngày, tranh chấp | 8 | 39 | 156 | — |
| #8 E08 | Sửa giao dịch đã chốt | 6 | 29 | 116 | — |
| #9 E09 | 完納奨励金 và version tỷ lệ (ràng buộc đặc thù Product A) | 20 | 69 | 276 | 47 |
| #10 E10 | Báo cáo & xuất dữ liệu kế toán | 19 | 64 | 256 | — |
| #11 E11 | Thông báo & tham số vận hành (nhóm B2) | 8 | 33 | 132 | — |
| #12 E12 | Vận hành khi mất mạng (2 task) | 5 | 30 | 120 | — |
| #13 E13 | Quản trị, audit và dữ liệu cá nhân | 7 | 28 | 112 | — |
| #14 E14 | NFR, hạ tầng & kiểm thử hệ thống | 6 | 33 | 132 | — |
| | **Tổng** | **146** | **629** | **2,516** | **47** |

Theo loại việc (SWP): BE 202 · DB 144 · FE 140 · SPEC 74 · QA 37 · INF 32.

## 5. So sánh với LAB-1

LAB-1: sheet 01_Server của Effort Estimation, man-day phần dev BE + FE (Implement + FixBug + UT), không tính Design, chưa buffer 0,3. LAB-5: Hours ÷ 7 (4 h / SWP).
Chênh tổng chủ yếu do hệ số giờ **PREMISE A-05** (4 h / SWP; nếu dùng hệ số LAB-1 6.8 h / SWP thì tổng bằng LAB-1). Cột *Vì sao* ghi thêm chênh ở cùng hệ số 6.8 h / SWP để thấy chỗ phạm vi thật sự khác.

| Phần (chức năng / epic) | LAB-1 (man-day) | LAB-5 (man-day) | Chênh | Vì sao |
|---|---|---|---|---|
| E01 Nền tảng & khung kỹ thuật ← LAB-1 Dòng 1–2: khung dự án, bộ giao diện dùng chung | 32.0 | 24.0 | -25% | **A-05**. Cùng hệ số: +28%. INF 13 SWP: khung dự án + 3 môi trường (E01-01); LAB-1 tính hạ tầng ở sheet khác. SPEC 7 SWP (**S-02 / H-03**) |
| E02 Xác thực & phân quyền ← LAB-1 F01 | 36.0 | 32.0 | -11% | **A-05**. Cùng hệ số: +51%. Thiết kế LAB-4 thêm áp Role_Matrix 7 vai trò (E02-05, 12 SWP) và bảng user_roles + API ADM-2 (E02-04, 17 SWP); F01 LAB-1 chỉ có đăng nhập / MFA / khóa / tài khoản. SPEC 6 SWP (**S-02**) |
| E03 Người tham gia & tư cách 許可 / 承認 / 登録 ← LAB-1 F02 | 48.0 | 41.7 | -13% | **A-05**. Cùng hệ số: +48%. Thiết kế LAB-4 đổi vòng đời tư cách và phải chuyển dữ liệu prototype (E03-01, 10 SWP); QA 8 SWP. SPEC 4 SWP (**S-02**) |
| E04 Lot ← LAB-1 F03 trừ F03-08 (offline) | 53.0 | 29.7 | -44% | **A-05**. Cùng hệ số: -5%. Gần khớp. SPEC 7 SWP (**S-02**) |
| E05 Giao dịch 相対取引 / せり ← LAB-1 F04 + F05 | 65.0 | 30.3 | -53% | **A-05**. Cùng hệ số: -21%. Gồm chế độ DUAL tách riêng E05-03, 10 SWP (**H-01**).|
| E06 Giao hàng ← LAB-1 F06 trừ F06-06 (offline) | 44.0 | 16.0 | -64% | **A-05**. Cùng hệ số: -38%. Đã tách phần offline sang E12 ở cả hai bên để so cùng phạm vi. |
| E07 Đối soát ngày, khóa / mở lại ngày, tranh chấp ← LAB-1 F07 | 53.0 | 22.3 | -58% | **A-05**. Cùng hệ số: -28%. Gồm API tranh chấp thêm mới E07-05, 11 SWP (**S-01**); SPEC 9 SWP (**S-02**). |
| E08 Sửa giao dịch đã chốt ← LAB-1 F08 | 26.0 | 16.6 | -36% | **A-05**. Cùng hệ số: +9%. Gần khớp. SPEC 3 SWP (**S-02**) |
| E09 完納奨励金 và version tỷ lệ (ràng buộc đặc thù Product A) ← LAB-1 F09 + F10 | 57.0 | 39.4 | -31% | **A-05**. Cùng hệ số: +18%. Thiết kế LAB-4 thêm version tỷ lệ, quota 4 lần / năm, rollback; nguồn thanh toán E09-06, 6 SWP (**S-01**). 47 SWP Blocked chấm theo giả định Q-05 / Q-06 (**H-02**) |
| E10 Báo cáo & xuất dữ liệu kế toán ← LAB-1 F11 | 77.0 | 36.6 | -53% | **A-05**. Cùng hệ số: -19%. Thêm đặc tả trường 12 báo cáo E10-01, 6 SWP (**S-03**); in PDF 2 phiếu E10-08, 4 SWP (**S-04 / A-01**). 9 task low vì chưa có đặc tả trường, có thể tăng sau E10-01 |
| E11 Thông báo & tham số vận hành (nhóm B2) ← LAB-1 F12 + dòng 3 (C002 / C003) | 42.0 | 18.9 | -55% | **A-05**. Cùng hệ số: -24%. Gồm API C002 / C003 / N002 thêm mới E11-06, 4 SWP (**S-01**); SPEC 10 SWP (**S-02**). |
| E12 Vận hành khi mất mạng (2 task) ← LAB-1 F03-08 + F06-06 | 30.0 | 17.1 | -43% | **A-05**. Cùng hệ số: -3%. Gần khớp |
| E13 Quản trị, audit và dữ liệu cá nhân ← LAB-1 F13 + F14 | 49.0 | 16.0 | -67% | **A-05**. Cùng hệ số: -44%. Audit không làm riêng: nằm trong DoD của mọi task (task-breakdown §1), nên effort chia sang các epic khác. Gồm A005 và xuất dữ liệu cá nhân E13-03 / E13-04, 12 SWP (**S-01**) |
| E14 NFR, hạ tầng & kiểm thử hệ thống ← LAB-1 — | 0.0 | 18.9 | — | **A-05**. LAB-1 không có dòng ở 01_Server (NFR / hạ tầng / kiểm thử hệ thống nằm ở sheet khác của LAB-1) |
| F15 Công cụ chuyển đổi dữ liệu | 38.0 | 0 | −100% | LAB-4 không thiết kế nên không vào backlog (**H-04**) |
| **Tổng** | **650.0** | **359.4** | **-45%** | Không gồm F15: 612.0 → 359.4 (-41%), do **A-05** |

Ngoài 01_Server: đào tạo, UAT, hypercare, quản lý dự án, BrSE của LAB-1 không có trong backlog (**H-04**). LAB-5 không cộng buffer 0,3 vào `Hours`.
Lưu ý: SWP của LAB-5 gồm cả task SPEC / QA / INF, còn cột LAB-1 chỉ có dev, nên so sánh từng dòng chỉ mang tính tham khảo.
