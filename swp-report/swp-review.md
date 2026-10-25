# Review SWP — PL điền

> Task có SWP ≥ 8 hoặc confidence low (skill estimate-swp, run 20261023-2132). Kết quả: PL review cả 40 task, không sửa điểm (2026-10-25).

| Issue | Task | SWP skill | Conf. | Lý do của skill (tóm tắt) | PL | Lý do của PL |
|---|---|---|---|---|---|---|
| #40 | E02-05 Áp Role_Matrix ở API và giao diện | 12 | medium | Applying Role_Matrix of 7 roles across 40 screens and 55 APIs in API and UI; DB functions re-check creator not equal approver rules (seven decisions). | Giữ 12 |  |
| #38 | E02-04b Migration roles text[] → user_roles + API ADM-2 | 10 | medium | Migrate app_users.roles text[] to user_roles join table, then ADM-2 GET/POST/PUT with grant/revoke and reset MFA; role readers must be updated. | Giữ 10 |  |
| #42 | E03-01 Migration DB tư cách: trạng thái mới, events, requests | 10 | medium | New qualification statuses, two new tables, parties.status narrowed to ACTIVE/INACTIVE, direct valid_to edit removed; prototype data with two suspension laye… | Giữ 10 |  |
| #99 | E06-04 Màn hình D001 / D002 | 10 | medium | D001 list plus D002 detail (52-row sheet, exception merged) with multi-delivery entry and offline queue (D16), which needs sync and retry reasoning. | Giữ 10 |  |
| #115 | E08-02a Delta, ngày ghi nhận, cập nhật lot / giao hàng | 10 | medium | review_correction approval writes delta, applied_biz_date rule, lot recompute, delivery update, incentive carryover and FINAL-period blocking across trades, … | Giữ 10 |  |
| #162 | E10-06 Xuất CSV kế toán | 10 | medium | export_accounting (14 rows) plus EXP-1 (17 rows) and EXP-2 signed-URL re-download; locked days only, one batch per day, IF-ACC-01 format, who/when audit, irr… | Giữ 10 |  |
| #178 | E12-02 API đồng bộ idempotent | 10 | medium | SYN-1 sync endpoint (18-row sheet): ordered apply, idempotency via client_ops/client_op_id, official lot code assignment, duplicate checks, delivery re-valid… | Giữ 10 |  |
| #79 | E05-02a Hàm confirm_trade (SINGLE) | 9 | medium | confirm_trade single transaction with row lock, market-open, buyer and seller qualification at business day, no oversell, audit for both, recalc call; peak 6… | Giữ 9 |  |
| #18 | E01-01c Dựng staging / production, biến môi trường, `TRADE_CONFIRM_M | 8 | medium | Staging and production on Vercel plus Supabase with env vars; TRADE_CONFIRM_MODE only changes via CR and deploy, not while PENDING_CONFIRM trades exist (D32). | Giữ 8 |  |
| #24 | E01-04 UI kit dùng chung (layout, bàn phím, tiền, che APPI) | 8 | medium | Shared kit with layout, tablet keyboard, money format and role-based APPI masking (38 spec rows), i18n JA/VI, used by 40 screens so blast radius is wide. | Giữ 8 |  |
| #52 | E03-04e Test ma trận loại × trạng thái × loại yêu cầu (kiểm tra lại  | 8 | medium | Test matrix of qualification type by status by request type including approval-time re-check; covers RELEASE, REVOKE, REREVIEW, expiry blocks across three ty… | Giữ 8 |  |
| #61 | E03-08c P002 vùng B / C / D: tư cách, lịch sử, dialog yêu cầu | 8 | medium | P002 areas B, C, D: qualifications tab, state history, three request dialogs (RELEASE/REREVIEW/REVOKE) with evidence upload and approval, wired to PTY-2..8 a… | Giữ 8 |  |
| #71 | E04-04c Màn hình L003 (vùng A–E, stepper 6 trạng thái, số chờ xác nh | 8 | medium | L003 detail screen, 53-row spec, areas A-E (L004 merged), 6-state stepper, pending-confirm quantity in DUAL mode, evaluation and publish actions. | Giữ 8 |  |
| #95 | E06-02a Luồng chính: nhiều lần, ngoại lệ, kiểm tra tư cách bên mua | 8 | medium | record_delivery main flow (21-row spec, API DLV-2, offline SYN-1 path) with buyer qualification block, cumulative completion rule, day attribution and lot re… | Giữ 8 |  |
| #107 | E07-04 Màn hình đối soát S001 / S002 | 8 | medium | S001/S002 52-row sheet: summary, lock with blocking/warning lists, reopen request and approval, export status; several states across one workflow. | Giữ 8 |  |
| #110 | E07-05b API + màn hình S003 / S004 | 8 | medium | New dispute API with audited functions plus S003 list and S004 detail screens; lock warning and SLA report feed. | Giữ 8 |  |
| #118 | E08-03 Màn hình S006 / S007 / S008 | 8 | medium | Three screens (create, list, review) sharing a 52-row sheet; integrates COR-1..5 and ATT-1 evidence upload; shows current, new, expected delta and applied date. | Giữ 8 |  |
| #125 | E09-05 Màn hình R001 / R002 | 8 | medium | R001 list with x/4 quota count and R002 52-row detail: draft, review, effective date rules, comparison with active version (RUL-3). | Giữ 8 |  |
| #195 | E14-04 Triển khai Data Encryption Checklist | 8 | medium | Implements several controls across layers: RLS read-only, at-rest encryption, display masking, private bucket with 5-minute signed URLs, TLS and env secrets;… | Giữ 8 |  |
| #147 | E10-02b Hiện thực + test | 6 | low | Implement and test scheduled build_daily_reports (pg_cron, day-lock trigger, job logging, 11:00 SLA at 1,200 trades/day); spec not yet written. | Giữ 6 |  |
| #191 | E13-05b Hiện thực + test | 6 | low | Scheduled job moving attachments to cold storage after 3 years, no hard delete, 7-year online retention; storage and DB state must stay consistent; spec not … | Giữ 6 |  |
| #49 | E03-04b Nhánh 許可 (仲卸): RELEASE + điều kiện + bằng chứng | 5 | low | License branch for intermediate wholesalers: RELEASE needs conditions met and mandatory evidence attachment before approval; involves storage attachment and … | Giữ 5 |  |
| #128 | E09-06b API nhập CSV thanh toán (LAB-4 chưa có) | 5 | low | CSV import endpoint plus payments table writes; format and source unknown (Q-05), no API in 55-API list. Validation/parsing states give moderate difficulty. | Giữ 5 |  |
| #188 | E13-04 Xuất dữ liệu cá nhân theo yêu cầu (APPI) | 5 | low | Personal data export on request across parties, app_users and qualifications; masking and access restrictions apply, but no API, function or screen spec exists. | Giữ 5 |  |
| #109 | E07-05a Đặc tả API tranh chấp (API List LAB-4 chưa có) | 3 | low | Specify dispute API absent from 55-API list; replaces direct PUT with audited function (B-23); feeds lock warning and RPT-09. Number of endpoints unspecified. | Giữ 3 |  |
| #131 | E09-07b Xác định đúng hạn và số tiền đủ điều kiện | 3 | low | DB function slice: determine on-time payment and eligible amount from payments; depends on payments data shape, with several edge cases. | Giữ 3 |  |
| #143 | E09-12 Báo cáo RPT-07 kết quả 完納奨励金 theo kỳ | 3 | low | RPT-07 incentive results per period: query plus endpoint; field spec pending E10-01. | Giữ 3 |  |
| #153 | E10-03e RPT-05 Bảng đối soát ngày | 3 | low | RPT-05 daily reconciliation sheet uses delta-by-applied_biz_date figures; reconciliation across totals adds moderate logic. | Giữ 3 |  |
| #154 | E10-03f RPT-06 Bảng xuất đối soát kế toán | 3 | low | RPT-06 accounting reconciliation output table; query plus endpoint, shape likely related to accounting export. | Giữ 3 |  |
| #156 | E10-03h RPT-09 Tranh chấp và SLA | 3 | low | RPT-09 disputes and SLA; report with SLA elapsed computation. | Giữ 3 |  |
| #160 | E10-04c RPT-12 Thay đổi quy định và version | 3 | low | RPT-12 rule/rate changes over rate_versions and ops_setting_versions; two version sources unioned. | Giữ 3 |  |
| #175 | E11-05 Trang chủ C002 | 3 | low | One home dashboard screen C002, list-only spec; no dashboard API exists so content and data source are unclear. | Giữ 3 |  |
| #197 | E14-06 Ma trận tương thích trình duyệt / tablet | 3 | low | Compatibility pass over PC browsers and tablet PWA; device and browser matrix unspecified, so breadth assumed to be a small matrix with routine execution. | Giữ 3 |  |
| #151 | E10-03c RPT-03 Người tham gia đã / sắp hết hiệu lực | 2 | low | RPT-03 participants expired or expiring; simple date-filtered list report. | Giữ 2 |  |
| #158 | E10-04a RPT-10 Theo người tham gia | 2 | low | RPT-10 monthly aggregation by party; one report query and endpoint. | Giữ 2 |  |
| #159 | E10-04b RPT-11 Theo loại giao dịch | 2 | low | RPT-11 monthly aggregation by trade type; one report query and endpoint. | Giữ 2 |  |
| #165 | E10-08a Mẫu PDF phiếu nhận lot (FORM-LOT-01) | 2 | low | One browser-printed PDF form (FORM-LOT-01); deterministic template work, but no layout spec so layout detail is assumed. | Giữ 2 |  |
| #166 | E10-08b Mẫu PDF phiếu giao hàng (FORM-DEL-01) | 2 | low | One browser-printed PDF form (FORM-DEL-01); deterministic template work, layout unspecified. | Giữ 2 |  |
| #119 | E09-01 Làm rõ công thức thưởng và lấy test vector | 1 | low | Customer clarification of bonus formula and test vectors; formula known, vectors unavailable (Q-01) and payment source awaits Q-05; no implementation structu… | Giữ 1 |  |
| #127 | E09-06a Làm rõ nguồn và định dạng dữ liệu thanh toán | 1 | low | Clarify payment data source and format; blocked on customer Q-05, no import API exists, payments table kept from prototype. Structure unresolved. | Giữ 1 |  |
