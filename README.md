# sakura-ichiba-proto — LAB-5: break task, GitHub Project và báo cáo tiến độ

Product A: hệ thống hỗ trợ nghiệp vụ chợ bán buôn thủy sản cho 株式会社 桜水産市場 (khách hư cấu của chương trình LAB AIDD for PL).
Repo này chứa prototype LAB-2 / LAB-3 và kết quả LAB-5. README của prototype chuyển sang `docs/README-prototype.md`.

## 1. LAB-5 làm gì

- Chia bộ thiết kế LAB-4 (`specs-v2`, quyết định D1–D55) thành **14 epic → 86 issue → 97 sub-issue** (146 task lá).
- Mỗi task lá có điểm **SWP** (skill estimate-swp, PL đã review) và **Hours** (1 SWP = 4 h).
- 完納奨励金 tách thành epic riêng (E09) với 12 issue; phần phụ thuộc công thức để Blocked chờ khách.
- Giả lập 3 sprint đầu và viết báo cáo tiến độ cho Sprint 3 (07/12–18/12/2026).

## 2. Link

| | |
|---|---|
| GitHub Project (public) | https://github.com/users/minhdt-0293/projects/2 |
| Issue | https://github.com/minhdt-0293/sakura-ichiba-proto/issues — #1–#14 là epic, #15–#197 là issue / sub-issue |
| View gợi ý trên Project | Lọc `Iteration = Sprint 3` để xem sprint báo cáo; nhóm theo `Status` để xem dạng board |

Field trên Project: `Status` (Todo / In Progress / In Review / Done / Blocked), `Iteration` (Sprint 1–18, 2 tuần), `Owner (giả định)`, `SWP`, `Hours`, `Kind`, `Spec`, `Constraint`.

## 3. Đọc theo thứ tự

| File | Nội dung |
|---|---|
| [PREMISE.md](PREMISE.md) | Chỗ khác so với LAB-4 (S-01..S-04), giả định bổ sung (A-01..A-06), hướng đã chốt (H-01..H-04) |
| [task-breakdown.md](task-breakdown.md) | Nguyên tắc chia task và DoD, bảng spec → issue, các issue 完納奨励金, chỗ hở của spec LAB-4 (G-01..G-06) |
| [estimate.md](estimate.md) | Report SWP, review của PL, quy đổi giờ, tổng theo epic, so sánh với LAB-1 |
| [progress-report.md](progress-report.md) | Báo cáo Sprint 3 (**giả lập**): trạng thái, burndown, rủi ro trễ |
| [AI-report.md](AI-report.md) | Dùng AI thế nào, AI sai ở đâu và cách phát hiện, con người quyết định ở đâu |

## 4. Cấu trúc repo (phần LAB-5)

```
README.md, PREMISE.md, task-breakdown.md, estimate.md, progress-report.md, AI-report.md
docs/
  burndown-sprint3.png        biểu đồ burndown Sprint 3 (giả lập)
  README-prototype.md         README cũ của prototype LAB-2
swp-report/
  estimate-swp-*.html         report của skill estimate-swp (lần chạy 3, bản dùng)
  swp-review.md               40 task PL review
lab5/
  backlog.json                backlog 197 mục (nguồn để tạo issue)
  issue_map.json              mã task ↔ số issue ↔ item trên Project
  swp.json                    SWP của 146 task lá + hệ số giờ
  sprint_plan.json            task lá → sprint (giả lập, Sprint 1–4)
  sim_sprint3.json            kịch bản trạng thái Sprint 3 (giả lập)
  setup_project.py            tạo label, issue, sub-issue, Project, field
  update_fields.py            ghi SWP / Hours lên Project
  set_sprint.py               ghi Iteration / Status giả lập lên Project
  PROMPT-claude-code.md       các bước còn lại chạy trong Claude Code
(các thư mục còn lại là code prototype LAB-2 / LAB-3, LAB-5 không sửa)
```

## 5. Chạy lại

Cần Python 3.9+ và GitHub CLI `gh` đã đăng nhập với scope `repo`, `project` (`gh auth refresh -s project`). Chạy trong thư mục `lab5/`:

```
python3 setup_project.py --dry-run   # xem trước
python3 setup_project.py             # tạo issue + Project; chạy lại được, phần đã tạo được bỏ qua
python3 update_fields.py             # ghi SWP / Hours (sửa swp.json rồi chạy lại để cập nhật)
python3 set_sprint.py                # ghi Iteration / Status giả lập
```

Nội dung trong repo do người học tự viết (có AI hỗ trợ, xem AI-report.md). Không có dữ liệu thật của khách, không có thông tin cá nhân, không có secret.
