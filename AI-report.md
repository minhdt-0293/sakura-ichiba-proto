# AI-report — LAB-5


## 1. Công cụ và cách dùng

| Công cụ | Dùng cho | Đầu ra |
|---|---|---|
| Claude (Cowork) | Break backlog từ spec LAB-4 v2; phát hiện chỗ hở G-01..G-06; viết script GitHub; đề xuất kế hoạch sprint và kịch bản giả lập; viết các file md | `lab5/backlog.json`, các script trong `lab5/`, task-breakdown.md, PREMISE.md, estimate.md, progress-report.md |
| Skill estimate-swp (chạy trong Claude Code) | Chấm SWP 146 task lá theo ma trận Scope × Complexity | `swp-report/*.html` (3 lần chạy) |
| Claude Code + GitHub CLI (`gh`) trên máy PL | Chạy script tạo 197 issue, 183 liên kết sub-issue, Project và field; ghi SWP / Hours / Iteration / Status | GitHub Project #2 |

Cách làm việc: AI đề xuất theo từng chặng, PL duyệt rồi mới làm tiếp. Chỗ đề / spec không nói rõ thì AI đưa phương án + khuyến nghị + trade-off để PL chọn.

Quyết định do PL chốt:

| Quyết định | Phương án chốt |
|---|---|
| Xử lý 6 chỗ hở của spec LAB-4 | G-01 A, G-02 B, G-03 A, G-04 B, G-05 B, G-06 A (task-breakdown.md §4) |
| Bản SWP dùng | Lần chạy 3 (spec v2). Bỏ lần 1–2 |
| Review SWP | Review 40 task (SWP ≥ 8 hoặc low), không sửa điểm |
| Hệ số giờ | 4 h / SWP (AI khuyến nghị theo LAB-1; PL chọn 4 h theo kinh nghiệm + hiệu quả AI) |
| Kế hoạch / giả lập | 12 SWP / người / sprint; giả lập Sprint 3; duyệt kịch bản Done 38 / 52 |

## 2. AI sai ở đâu, phát hiện và sửa thế nào

| # | AI sai / rủi ro | Ai phát hiện, bằng cách nào | Sửa |
|---|---|---|---|
| V-01 | Skill SWP lần 1–2 chấm trên **spec LAB-4 v1**, không phải v2 | Claude đọc lý do chấm trong report: có tên chỉ v1 mới có (`rule_versions`, `UNDER_REVIEW`, MFA theo ADR-005 cũ), không có tên của v2 | PL chạy lại với thư mục spec v2 trên Drive (lần 3). Kiểm lại: không còn dấu vết v1 |
| V-02 | Điểm SWP **không ổn định giữa các lần chạy**: tổng gần như không đổi (629 / 636 / 629) nhưng 39 task (lần 2) và 63 task (lần 3) có điểm khác lần 1 | Claude so sánh 3 report theo từng task | Không dùng tổng để kết luận độ chính xác; PL review các task điểm cao và độ tin cậy low. Report chỉ có một người chấm (mức `medium`) |
| V-03 | Claude tính **sai hệ số tham chiếu từ LAB-1**: trừ F15 hai lần, ra 574 man-day / 6,4 h/SWP thay vì 612 man-day / 6,8 h/SWP | Claude tự phát hiện khi viết estimate.md (tính lại theo từng epic, tổng không khớp) | Sửa PREMISE A-05 và estimate.md §3. Mức chênh của 4 h/SWP so với LAB-1 là khoảng 41%, không phải 37% |
| V-04 | Bản đầu của kế hoạch sprint (xếp tham lam theo năng lực) **bỏ qua phụ thuộc**: load test ở Sprint 2, FE trước BE | Claude kiểm danh sách task từng sprint | Thêm sprint bắt đầu tối thiểu cho từng epic và thứ tự SPEC → BE → FE trong issue. Vẫn còn vài task FE làm trước BE, ghi là giả định "FE làm trên API mock" (A-06) |
| V-05 | Lúc đề xuất kịch bản, Claude viết "QA-1 và INF-1 trống ở Sprint 1–4" — sai với INF-1 | Claude phát hiện khi viết progress-report từ dữ liệu kế hoạch | Báo cáo ghi đúng: INF-1 trống ở Sprint 3–4 |
| V-06 | Bản nháp progress-report dùng quy tắc review PR của một dự án khác (không thuộc Product A) | Claude rà lại trước khi gửi | Bỏ khỏi báo cáo |
| V-07 | Script `setup_project.py` chạy thử bị treo vì vẫn `sleep` ở chế độ dry-run; script ghi Project dừng khi mạng / GitHub lỗi tạm thời | Chạy thử | Bỏ `sleep` khi dry-run; thêm thử lại khi lỗi mạng / 5xx |

Việc AI làm có ích nhất (để PL tự đánh giá): Estimate theo SWP, là cơ sở và căn cứ để estimate theo cùng 1 hệ

## 3. Con người tham gia và tự đánh giá

| Giai đoạn | PL làm gì |
|---|---|
| Chọn đầu vào | Chọn spec LAB-4 v2, repo, bản estimate LAB-1 trên Drive |
| Break task | Chọn phương án cho G-01..G-06 |
| Chấm điểm | Chạy skill 3 lần, chọn bản dùng, review 40 task |
| Quy đổi giờ | Chốt 4 h / SWP |
| GitHub | Chạy script trên máy, kiểm Project trên web |
| Báo cáo | Chọn sprint giả lập, duyệt kịch bản |

Tự đánh giá:
- Điểm làm tốt: Vận dụng được AI trong hầu hết các công việc
- Điểm chưa tốt / làm lại thì đổi gì: Review và đánh giá kỹ hơn về các thông tin của AI
- Lý do không sửa điểm nào khi review SWP: Chưa có sự đo lường của SWP
- Giờ thực tế đã dùng cho LAB-5 (làm tròn 0,5 h): 24h
