# task-breakdown — Product A (桜水産市場)

> Nguồn: bộ thiết kế LAB-4 `specs-v2` (2026-10-21, quyết định D1–D55). Mỗi issue dẫn mã màn hình / API / hàm / bảng / D-x của LAB-4.
> Backlog: 14 epic · 86 issue · 97 sub-issue.

## 1. Nguyên tắc chia task

**Độ hạt**

- Một issue là **một kết quả kiểm tra được độc lập**: một hàm nghiệp vụ DB + API của nó, một màn hình, một báo cáo, hoặc một việc đặc tả / làm rõ.
- Dừng chia khi issue làm xong được trong một sprint bởi một người, và có tiêu chí nghiệm thu viết được thành test.
- **Tách sub-issue** khi issue có một trong các đặc điểm:
  - có phần BE, FE và test do người khác nhau làm;
  - có nhánh nghiệp vụ riêng cần test riêng (ví dụ 3 nhánh gỡ tạm ngừng);
  - cần đặc tả trước khi code (hàm LAB-4 ghi "Chưa — LAB-5" mà có rule mới D-x).
- Migration DB đi cùng epic chức năng, không gom thành epic riêng, để mỗi epic tự đóng được.

**Định nghĩa xong (DoD)**

1. Code merge, CI xanh.
2. Unit test cho mọi mã lỗi trong Function spec của hàm liên quan.
3. Tiêu chí nghiệm thu trong issue đạt.
4. Đúng Screen Spec / API Design LAB-4, hoặc chỗ khác đã ghi vào PREMISE.md.
5. Thao tác ghi có audit.
6. Người review khác người làm.
7. Issue đặc tả (SPEC): bản đặc tả được PL duyệt và cập nhật vào bộ spec.

**Trên GitHub Project**

- Epic = issue có label `epic`, chứa các issue con bằng **sub-issue** của GitHub.
- Issue thường là sub-issue của epic; sub-issue cấp 2 là sub-issue của issue.
- Field:
  - `Status` (Todo / In Progress / In Review / Done / Blocked)
  - `Iteration` (sprint 2 tuần)
  - `Owner (giả định)`
  - `SWP` (điểm đã review)
  - `Hours` (giờ ước lượng)
  - `Kind`
  - `Spec`
  - `Constraint`
- Điểm và giờ ghi ở cấp **issue lá**. Epic và issue có sub-issue lấy tổng.

## 2. Spec → issue

| Spec (LAB-4) | Epic | Issue / sub-issue | Phần spec chưa thành issue và vì sao |
|---|---|---|---|
| ARCHITECTURE §2, ADR-009, Common_Spec CS-01..14 | #1 (E01) Nền tảng & khung kỹ thuật | #15 (E01-01) Khung dự án và 3 môi trường (local / staging / production) (3 sub)<br>#19 (E01-02) Khung hàm nghiệp vụ DB và audit chỉ thêm (3 sub)<br>#23 (E01-03) Dịch mã lỗi sang message JA/VI (59 message)<br>#24 (E01-04) UI kit dùng chung (layout, bàn phím, tiền, che APPI)<br>#25 (E01-05) Lịch chợ và 業務日 đang mở (2 sub) | — |
| C001, AUTH-1..3, ADM-2, Role_Matrix, NFR-SEC-01/03 | #2 (E02) Xác thực & phân quyền | #28 (E02-01) Đăng nhập qua proxy và khóa tạm khi sai nhiều lần (3 sub)<br>#32 (E02-02) MFA (TOTP) cho role quản trị và phê duyệt (2 sub)<br>#35 (E02-03) Step-up MFA khi TRADE / DELIVERY xác nhận<br>#36 (E02-04) Vai trò người dùng và quản lý tài khoản (3 sub)<br>#40 (E02-05) Áp Role_Matrix ở API và giao diện<br>#41 (E02-06) Hết phiên 30 phút, tablet tự đăng xuất 10:30 | — |
| P001, P002, PTY-1..8, FIG-004, FIG-010, ADR-002 | #3 (E03) Người tham gia & tư cách 許可 / 承認 / 登録 | #42 (E03-01) Migration DB tư cách: trạng thái mới, events, requests<br>#43 (E03-02) Kiểm tra tư cách lúc chốt (party_block_reason) (2 sub)<br>#46 (E03-03) Tạm ngừng tư cách (1 người)<br>#47 (E03-04) Gỡ tạm ngừng theo 3 nhánh và thu hồi (5 sub)<br>#53 (E03-05) Thẩm tra lại khi hết hạn (kỳ hiệu lực mới)<br>#54 (E03-06) Cấp tư cách lần đầu có duyệt (2 sub)<br>#57 (E03-07) Job đổi tư cách quá hạn sang EXPIRED<br>#58 (E03-08) Màn hình người tham gia P001 / P002 (3 sub) | — |
| L001..L004, LOT-1..6, FIG-011, ADR-004 | #4 (E04) Lot | #62 (E04-01) Migration DB lot: 6 trạng thái + lịch sử trạng thái<br>#63 (E04-02) Hàm tính lại trạng thái lot<br>#64 (E04-03) Tiếp nhận lot (L002) (3 sub)<br>#68 (E04-04) Ghi đánh giá và mở bán (L003 / L004) (3 sub)<br>#72 (E04-05) Sửa thuộc tính lot có kiểm soát (2 sub)<br>#75 (E04-06) Đính kèm chứng từ (Storage)<br>#76 (E04-07) Danh sách lot L001 | — |
| T001..T004, TRD-1..6, FIG-012, ADR-003 | #5 (E05) Giao dịch 相対取引 / せり | #77 (E05-01) Migration DB giao dịch<br>#78 (E05-02) Chốt giao dịch chế độ SINGLE (2 sub)<br>#81 (E05-03) Chế độ DUAL: giữ chỗ và người thứ hai xác nhận (2 sub)<br>#84 (E05-04) Màn hình 相対取引 T002 và kiểm tra trước tư cách (3 sub)<br>#88 (E05-05) Màn hình せり T004<br>#89 (E05-06) Hủy giao dịch (2 sub)<br>#92 (E05-07) Danh sách / chi tiết giao dịch T001 / T003 | — |
| D001, D002, DLV-1..3, FIG-014, FIG-029, ADR-006 | #6 (E06) Giao hàng | #93 (E06-01) Migration DB giao hàng<br>#94 (E06-02) Ghi giao hàng nhiều lần (3 sub)<br>#98 (E06-03) Xác nhận ngoại lệ giao hàng<br>#99 (E06-04) Màn hình D001 / D002 | — |
| S001..S004, STL-1..4, ADR-005, BR-CLOSE-01 | #7 (E07) Đối soát ngày, khóa / mở lại ngày, tranh chấp | #100 (E07-01) Số liệu ngày theo giá trị gốc + delta ghi nhận (2 sub)<br>#103 (E07-02) Khóa 業務日<br>#104 (E07-03) Mở lại ngày đã khóa (2 người) (2 sub)<br>#107 (E07-04) Màn hình đối soát S001 / S002<br>#108 (E07-05) Tranh chấp S003 / S004 (2 sub) | — |
| S006..S008, COR-1..5, FR-CORR-01..03, ADR-005 | #8 (E08) Sửa giao dịch đã chốt | #111 (E08-01) Lập yêu cầu sửa (2 sub)<br>#114 (E08-02) Duyệt yêu cầu sửa và sinh delta (3 sub)<br>#118 (E08-03) Màn hình S006 / S007 / S008 | — |
| R001..R004, RUL-1..5, INC-1..2, BR-INC-01, FR-INC-01..03, GOV-RULE-01, B.5, B.6, ADR-007 | #9 (E09) 完納奨励金 và version tỷ lệ (ràng buộc đặc thù Product A) | #119 (E09-01) Làm rõ công thức thưởng và lấy test vector<br>#120 (E09-02) Version tỷ lệ: DB và quota 4 lần / năm<br>#121 (E09-03) Soạn version và rollback khóa nội dung (2 sub)<br>#124 (E09-04) Duyệt version tỷ lệ<br>#125 (E09-05) Màn hình R001 / R002<br>#126 (E09-06) Nguồn dữ liệu thanh toán (payments) (2 sub)<br>#129 (E09-07) Tính 完納奨励金 theo kỳ (4 sub)<br>#134 (E09-08) Chốt kỳ thưởng<br>#135 (E09-09) Chênh lệch thưởng sang kỳ sau khi sửa giao dịch (2 sub)<br>#138 (E09-10) Màn hình tính / chi tiết thưởng R003 / R004<br>#139 (E09-11) Bộ test 完納奨励金 (3 sub)<br>#143 (E09-12) Báo cáo RPT-07 kết quả 完納奨励金 theo kỳ | — |
| B001..B003, RPT-01..12, EXP-1/2, IF-ACC-01 | #10 (E10) Báo cáo & xuất dữ liệu kế toán | #144 (E10-01) Đặc tả trường của 12 báo cáo<br>#145 (E10-02) Job dựng báo cáo ngày trước 11:00 (2 sub)<br>#148 (E10-03) 8 báo cáo ngày (8 sub)<br>#157 (E10-04) 3 báo cáo tháng (3 sub)<br>#161 (E10-05) Màn hình B001 / B002<br>#162 (E10-06) Xuất CSV kế toán<br>#163 (E10-07) Màn hình B003<br>#164 (E10-08) In phiếu nhận lot và phiếu giao hàng (PDF từ trình duyệt) (2 sub) | — |
| N001, N002, C003, NTF-1, JOB-1, BR-NOTIFY-01, ADR-007 | #11 (E11) Thông báo & tham số vận hành (nhóm B2) | #167 (E11-01) Version tham số vận hành (2 sub)<br>#170 (E11-02) Kiểm tra sự kiện và sinh thông báo (4 sự kiện) (2 sub)<br>#173 (E11-03) Gửi email qua outbox và retry<br>#174 (E11-04) Màn hình N001 / N002 / C003<br>#175 (E11-05) Trang chủ C002<br>#176 (E11-06) API cho C002 / C003 / N002 | — |
| SYN-1, SYN-2, S005, client_ops, sync_conflicts, NFR-AVL-02, ADR-008, D16 | #12 (E12) Vận hành khi mất mạng (2 task) | #177 (E12-01) PoC PWA + hàng đợi IndexedDB<br>#178 (E12-02) API đồng bộ idempotent<br>#179 (E12-03) Hàng đợi offline cho L002 / D002<br>#180 (E12-04) Xử lý xung đột đồng bộ S005 (2 sub) | — |
| A003..A005, AUD-1, ADM-1, 09-06 | #13 (E13) Quản trị, audit và dữ liệu cá nhân | #183 (E13-01) Tra cứu audit A003<br>#184 (E13-02) Lịch chợ A004 (không xóa vật lý)<br>#185 (E13-03) Danh mục dùng chung A005 (2 sub)<br>#188 (E13-04) Xuất dữ liệu cá nhân theo yêu cầu (APPI)<br>#189 (E13-05) Chuyển chứng từ sang lưu trữ lạnh sau 3 năm (2 sub) | — |
| Infra Design, Data Encryption Checklist, NFR-* | #14 (E14) NFR, hạ tầng & kiểm thử hệ thống | #192 (E14-01) Backup PITR và diễn tập restore<br>#193 (E14-02) Giám sát và cảnh báo vận hành<br>#194 (E14-03) Load test theo FIG-LOAD-01<br>#195 (E14-04) Triển khai Data Encryption Checklist<br>#196 (E14-05) Kiểm thử bảo mật cơ bản<br>#197 (E14-06) Ma trận tương thích trình duyệt / tablet | — |
| Công cụ chuyển đổi dữ liệu (F15), đào tạo, UAT, hypercare, quản lý dự án | — | — | LAB-4 không thiết kế (PREMISE LAB-4 §4). Xem G-06 |

## 3. Hạng mục chịu ràng buộc đặc thù của đề

| Ràng buộc | Issue | Vì sao tách riêng |
|---|---|---|
| 完納奨励金 | #119 (E09-01) Làm rõ công thức thưởng và lấy test vector | Có câu trả lời của khách hoặc giả định được PL ký; có bộ test vector |
| 完納奨励金 | #120 (E09-02) Version tỷ lệ: DB và quota 4 lần / năm | Quota đếm version đã duyệt, không đếm rollback |
| 完納奨励金 | #121 (E09-03) Soạn version và rollback khóa nội dung | Bản rollback không sửa được tiers (M_155) |
| 完納奨励金 | #124 (E09-04) Duyệt version tỷ lệ | Chỉ SETTLEMENT ≠ người lập; hiệu lực ≥ ngày mai và là ngày 1 của tháng; quá quota → M_120 |
| 完納奨励金 | #125 (E09-05) Màn hình R001 / R002 | Mọi event R002; nhóm A chỉ xem |
| 完納奨励金 | #126 (E09-06) Nguồn dữ liệu thanh toán (payments) | Có cách đưa dữ liệu thanh toán vào hệ thống, có audit |
| 完納奨励金 | #129 (E09-07) Tính 完納奨励金 theo kỳ | floor(eligible × rate × 110/100); quá hạn = 0; không ân hạn; lưu version tỷ lệ |
| 完納奨励金 | #134 (E09-08) Chốt kỳ thưởng | Chặn khi còn carryover chưa cộng (M_157); FINAL bất biến |
| 完納奨励金 | #135 (E09-09) Chênh lệch thưởng sang kỳ sau khi sửa giao dịch | Kỳ gốc FINAL → carryover vào kỳ kế tiếp; kỳ kế tiếp FINAL → chặn sửa (M_161) |
| 完納奨励金 | #138 (E09-10) Màn hình tính / chi tiết thưởng R003 / R004 | R004 hiện công thức từng dòng + version đã dùng |
| 完納奨励金 | #139 (E09-11) Bộ test 完納奨励金 | Pass test vector khách cung cấp + test biên quota, rollback, carryover, làm tròn |
| 完納奨励金 | #143 (E09-12) Báo cáo RPT-07 kết quả 完納奨励金 theo kỳ | Hiện version tỷ lệ và carryover; xuất CSV |

Lý do chung: 完納奨励金 có nhiều biến (cơ sở tính, bậc tỷ lệ, version theo ngày hiệu lực, hạn thanh toán, làm tròn, chốt kỳ, chênh lệch kỳ sau). Công thức còn giả định (Q-05, Q-06), và nghiệm thu bằng test vector (C.3). Gộp lại thì không estimate và không theo dõi được rủi ro (R-04 Extreme ở LAB-1).

## 4. Chỗ hở / mâu thuẫn của spec LAB-4 phát hiện khi break

| # | Spec | Chỗ hở / mâu thuẫn | Xử lý | Issue |
|---|---|---|---|---|
| G-01 | API Design (API List) | LAB-4 không có API cho: tranh chấp (S003/S004), danh mục (A005), trang chủ / thông báo / lịch sử gửi (C002/C003/N002), nhập thanh toán (payments), xuất dữ liệu cá nhân (09-06). Prototype LAB-2 có sẵn một phần (/api/disputes, /api/masters…) | PL chọn A: Tạo issue đặc tả API, bổ sung vào API Design khi làm (PREMISE §1 S-01) | #108 (E07-05), #126 (E09-06), #176 (E11-06), #185 (E13-03), #188 (E13-04) |
| G-02 | Function specifications (Function_List) | Nhiều hàm được gọi nhưng ghi 'Chưa — LAB-5': create_lot, cancel_trade, request_correction, request_reopen, save_rate_version, settlement_summary, create_first_qualification, participation_usage, build_daily_reports, run_notification_checks, resolve_sync_conflict, job lưu trữ lạnh | PL chọn B: Đặc tả **tất cả** hàm 'Chưa — LAB-5' trước khi code: mỗi issue dùng hàm đó có sub-issue SPEC đứng đầu (PREMISE §1 S-02) | #15 (E01-01), #19 (E01-02), #25 (E01-05), #28 (E02-01), #36 (E02-04), #43 (E03-02), #54 (E03-06), #64 (E04-03), #68 (E04-04), #72 (E04-05), #84 (E05-04), #89 (E05-06), #100 (E07-01), #104 (E07-03), #111 (E08-01), #121 (E09-03), #129 (E09-07), #145 (E10-02), #167 (E11-01), #170 (E11-02), #180 (E12-04), #189 (E13-05) |
| G-03 | TBL-REPORT-01 / Screen Spec B002 | LAB-4 chỉ có danh sách 12 báo cáo, chưa có danh sách cột của từng báo cáo | PL chọn A: Tạo issue đặc tả (E10-01), các issue báo cáo phụ thuộc (PREMISE §1 S-03) | #144 (E10-01), #148 (E10-03), #157 (E10-04) |
| G-04 | 09-03, D.3, Q-21 | RFP yêu cầu in chứng từ tại hiện trường; LAB-4 không có thiết kế in | PL chọn B: Giả định: in PDF từ trình duyệt cho phiếu nhận lot và phiếu giao hàng, estimate luôn (PREMISE §2 A-01) | #164 (E10-08) |
| G-05 | BR-INC-01, Q-01, Q-05, Q-06 | Công thức thưởng còn giả định (cơ sở tính, bậc, ngưỡng, kỳ, hạn); không có test vector C.3 vì thiếu fixture CSV | PL chọn B: Để mở: chưa làm phần tính 完納奨励金 tới khi khách trả lời Q-01 / Q-05 / Q-06. Các issue phụ thuộc công thức để Blocked (PREMISE §3 H-02) | #119 (E09-01), #139 (E09-11) |
| G-06 | LAB-4 phạm vi (PREMISE §4) | LAB-4 không thiết kế công cụ chuyển đổi dữ liệu (F15), đào tạo, UAT, hypercare, quản lý dự án | PL chọn A: Không đưa vào backlog LAB-5; ghi ở 'phần spec chưa thành issue' và khi so estimate LAB-1 | — |
