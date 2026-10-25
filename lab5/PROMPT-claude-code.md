# Prompt cho Claude Code — đưa LAB-5 lên repo và chuyển Public

Chạy trong thư mục repo `sakura-ichiba-proto` trên máy PL. Chép phần dưới vào Claude Code. DỪNG ở mỗi ⏸.

(Các bước tạo issue / Project / SWP / sprint đã chạy xong ngày 2026-10-23 bằng `setup_project.py`, `update_fields.py`, `set_sprint.py`.)

```
Bối cảnh: LAB-5 cho Product A. File LAB-5 đã có sẵn (giải nén [LAB5] final.zip vào gốc repo).
Không sửa code prototype.

Bước 0 — Kiểm tra secret trước khi public
- Liệt kê file đang được git track có thể chứa secret: .env*, *.pem, *key*, *secret*, *token*,
  và grep nội dung theo: SUPABASE_SERVICE_ROLE, service_role, sk_, ghp_, eyJhbGci.
- Kiểm cả lịch sử git: git log -p --all | grep -nE "service_role|SUPABASE_SERVICE|ghp_|sk_live" | head
- .env* phải có trong .gitignore.
- Nếu thấy secret: DỪNG, báo tôi (không tự xoá lịch sử).
⏸ Báo kết quả, chờ tôi duyệt.

Bước 1 — Sắp file
- Chuyển README.md hiện tại của prototype sang docs/README-prototype.md (nếu chưa).
- Đặt README.md, PREMISE.md, task-breakdown.md, estimate.md, progress-report.md, AI-report.md ở gốc repo.
- Copy từ ~/Lab 5/ vào lab5/: issue_map.json (bản mới nhất sau khi chạy script).
- Copy 3 report HTML của skill estimate-swp vào swp-report/
  (estimate-swp-lab5-backlog-20261023-2053.html, -2117.html, estimate-swp-lab5-backlog-drive-v2-20261023-2132.html).
- Kiểm: các link trong README.md trỏ đúng file.
⏸ Cho tôi xem git status.

Bước 2 — Commit và push
- Commit "LAB-5: backlog, estimate, progress report". Push lên nhánh main.
⏸ Báo link commit.

Bước 3 — Chuyển Public (tôi tự làm trên web hoặc bạn chạy):
  gh repo edit minhdt-0293/sakura-ichiba-proto --visibility public --accept-visibility-change-consequences
- Kiểm Project #2 đang Public: gh project view 2 --owner minhdt-0293 --format json | grep -i public
```
