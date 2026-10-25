# PREMISE — Tiền đề backlog LAB-5 · Product A (桜水産市場)

> Gốc: bộ thiết kế LAB-4 `specs-v2` (2026-10-21, quyết định D1–D55).
> File này ghi chỗ backlog LAB-5 khác bản LAB-4 đó.
> Mọi dòng đều do PL (Đỗ Tuấn Minh) chốt ngày 2026-10-22, trừ dòng ghi **chưa chốt**. A-05, A-06 và Sprint giả lập chốt ngày 2026-10-23.

## 1. Spec thêm / bỏ / sửa so với LAB-4

| # | Spec (mã / file LAB-4) | Thêm / Bỏ / Sửa | Trước → sau | Vì sao | Issue bị ảnh hưởng |
|---|---|---|---|---|---|
| S-01 | API Design (API List) | Thêm | 55 API → thêm API cho tranh chấp (S003/S004), danh mục (A005), trang chủ / thông báo / lịch sử gửi (C002/C003/N002), nhập thanh toán (payments), xuất dữ liệu cá nhân (09-06). Đặc tả trong issue rồi cập nhật vào API Design | Chỗ hở G-01 phát hiện khi break. Các màn hình trên có trong Screen_List nhưng API List không có API nào. Prototype LAB-2 có `/api/disputes`, `/api/masters`… nhưng LAB-4 chưa đối chiếu với RFP | E07-05, E09-06, E11-06, E13-03, E13-04 |
| S-02 | Function specifications (Function_List) | Sửa | 28 hàm ghi "Chưa — LAB-5" → **đặc tả tất cả trước khi code**. Mỗi issue dùng các hàm đó có sub-issue SPEC đứng đầu | Chỗ hở G-02. Function_List LAB-4 liệt kê hàm nhưng chỉ 19 hàm có spec | 22 issue, xem task-breakdown §4 G-02 |
| S-03 | TBL-REPORT-01, Screen Spec B002 | Thêm | Danh sách 12 báo cáo → thêm đặc tả cột, bộ lọc, nguồn dữ liệu cho từng báo cáo | Chỗ hở G-03. LAB-4 chỉ có tên báo cáo, không đủ để code và test (FR-RPT-01: "đủ trường bắt buộc") | E10-01, E10-03, E10-04 |
| S-04 | 09-03, D.3 (RFP), không có trong LAB-4 | Thêm | Chưa có → chức năng in PDF phiếu nhận lot và phiếu giao hàng (theo giả định A-01) | Chỗ hở G-04. RFP yêu cầu in chứng từ tại hiện trường, LAB-4 bỏ sót | E10-08 |

## 2. Giả định bổ sung

| # | Giả định | Chỗ spec / RFP để ngỏ | Ảnh hưởng tới issue / estimate |
|---|---|---|---|
| A-01 | In bằng PDF từ trình duyệt cho 2 loại phiếu: FORM-LOT-01, FORM-DEL-01. Không cần driver hay máy in nhiệt | 09-03 ("ràng buộc máy in nêu riêng"), Q-21 chưa có trả lời | E10-08 estimate theo phạm vi này. Nếu cần máy in nhiệt hoặc thêm phiếu → thêm issue |
| A-02 | Team giả định: BE-1 (nền tảng, xác thực, thông báo, offline), BE-2 (đối soát, sửa giao dịch, 完納奨励金, báo cáo), BE-3 (tư cách, lot, giao dịch, giao hàng), FE-1, FE-2, QA-1, INF-1, PL (đặc tả) | Đề LAB-5 yêu cầu "người phụ trách giả định" | Field `Owner (giả định)` trên Project; năng lực sprint tính theo team này |
| A-03 | Sprint 2 tuần, bắt đầu từ kick-off 09/11/2026 (RFP-07, WBS LAB-1). Sprint 1 = 09/11–20/11/2026 | Lịch chi tiết theo sprint chưa có ở LAB-1 / LAB-4 | Iteration trên Project. Sprint dùng để giả lập: Sprint 3 (07/12–18/12/2026) |
| A-04 | Gói dịch vụ Vercel / Supabase chưa sizing. Không ảnh hưởng effort phát triển | Infra slide 3 (D39: "chốt khi sizing ở LAB-5") | Không tạo issue sizing riêng; E14-03 load test cho số liệu đầu vào |
| A-05 | Quy đổi **1 SWP = 4 giờ**. PL đánh giá theo kinh nghiệm, có tính hiệu quả khi dùng AI. Thấp hơn hệ số tham chiếu từ LAB-1 (≈ 6,8 h/SWP) khoảng 41%. Mức giảm do AI là **giả định, chưa có số liệu đo** | Đề LAB-5 không quy định hệ số; skill SWP chỉ cho điểm | Field `Hours` = SWP × 4. Tổng 629 SWP ≈ 2.516 h. Kiểm chứng ở LAB-6 bằng giờ thực tế so với kế hoạch theo sprint (estimate.md §3) |
| A-06 | Kế hoạch sprint: mỗi người **12 SWP / sprint** (48 h / 70 h, hệ số tập trung ≈ 0,7). Xếp theo thứ tự epic, trong issue thì SPEC → BE → FE; FE có thể làm trước BE trên API mock theo API Design LAB-4. Chỉ ghi Iteration cho Sprint 1–4. Trạng thái Sprint 1–3 là **giả lập** | Chưa có velocity thực tế | `lab5/sprint_plan.json`, `lab5/sim_sprint3.json`; progress-report.md. Kế hoạch cần khoảng 12 sprint, chưa tính phần Blocked |

## 3. Hướng đã chốt

| # | Vấn đề | Các phương án ở LAB-4 | Phương án chốt | Vì sao |
|---|---|---|---|---|
| H-01 | Chế độ chốt giao dịch | D7: SINGLE mặc định, hỗ trợ DUAL bằng cấu hình (chờ Q-29) | Làm cả hai trong baseline. DUAL tách issue riêng (E05-03) | Q-29 chưa có trả lời. Tách riêng để nếu khách chọn SINGLE thì bỏ được E05-03 mà không đụng E05-02 |
| H-02 | Làm 完納奨励金 khi công thức còn giả định (G-05) | LAB-4 dùng giả định Q-05 / Q-06 để thiết kế; chưa có test vector (Q-01) | **Để mở.** Chưa làm phần phụ thuộc công thức tới khi khách trả lời Q-01 / Q-05 / Q-06. E09-06..E09-12 để Blocked. E09-01 (làm rõ) làm ngay | Căn cứ liên quan: FR-INC-01 nghiệm thu bằng test vector C.3, mà test vector chưa có (Q-01). Hệ quả: rủi ro trễ epic E09, ghi ở progress-report |
| H-03 | Mức đặc tả trước khi code (G-02) | LAB-4 để 28 hàm "Chưa — LAB-5" | Đặc tả tất cả trước khi code (S-02) | Hệ quả: thêm 22 sub-issue SPEC do PL làm, đứng trước phần code của issue |
| H-04 | Phần LAB-4 không thiết kế (G-06): migration F15, đào tạo, UAT, hypercare, quản lý dự án | Không có trong LAB-4 | Không đưa vào backlog LAB-5 | Đề LAB-5 break từ detail design. Phần chênh với LAB-1 ghi ở estimate.md |
