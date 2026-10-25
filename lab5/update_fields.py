#!/usr/bin/env python3
"""Ghi SWP / Hours lên GitHub Project (chạy SAU setup_project.py).

Đầu vào (cùng thư mục với script):
  backlog.json     — cây epic / issue / sub
  issue_map.json   — do setup_project.py tạo (item_id, project id)
  swp.json         — SWP của các task lá (skill estimate-swp, đã PL review) + hours_per_swp
Quy tắc:
  - Task lá: SWP = swp.json, Hours = SWP × hours_per_swp (PREMISE A-05: 4 h/SWP).
  - Epic / issue có sub-issue: SWP, Hours = tổng của các con (task-breakdown §1).
Chạy:  python3 update_fields.py [--dry-run]
Sửa điểm sau khi review: đổi số trong swp.json rồi chạy lại (ghi đè, không tạo trùng).
"""
import json, subprocess, sys, time, pathlib

HERE = pathlib.Path(__file__).resolve().parent
CFG = json.loads((HERE / "backlog.json").read_text(encoding="utf-8"))
STATE = json.loads((HERE / "issue_map.json").read_text(encoding="utf-8"))
SW = json.loads((HERE / "swp.json").read_text(encoding="utf-8"))
DRY = "--dry-run" in sys.argv
HPS = SW["hours_per_swp"]

def gql(query, **v):
    args = ["gh", "api", "graphql", "-f", f"query={query}"]
    for k, val in v.items(): args += ["-f", f"{k}={val}"]
    for attempt in range(5):
        r = subprocess.run(args, capture_output=True, text=True, encoding="utf-8")
        if r.returncode == 0: return json.loads(r.stdout).get("data", {})
        if any(s in r.stderr.lower() for s in ("rate limit", "secondary", "error connecting", "timeout", "connection reset", "eof", "something went wrong", "502", "503", "504")):
            print("  … mạng / rate limit, thử lại sau", 15 * (attempt + 1), "giây"); time.sleep(15 * (attempt + 1)); continue
        raise SystemExit(r.stderr)
    raise SystemExit("rate limit, chạy lại sau")

# 1. tính điểm: lá lấy từ swp.json, cha cộng dồn từ con
kids = {}
for it in CFG["items"]:
    if it["parent"]: kids.setdefault(it["parent"], []).append(it["key"])
missing = [it["key"] for it in CFG["items"] if it["key"] not in kids and it["key"] not in SW["swp"]]
if missing: raise SystemExit(f"Thiếu SWP cho task lá: {missing}")
memo = {}
def total(k):
    if k not in memo: memo[k] = SW["swp"][k] if k not in kids else sum(total(c) for c in kids[k])
    return memo[k]
epics = [it["key"] for it in CFG["items"] if it["level"] == "epic"]
print("Tổng SWP:", sum(total(e) for e in epics), "· Hours:", sum(total(e) for e in epics) * HPS)
if DRY:
    for e in epics: print(f"  {e}: {total(e)} SWP · {total(e) * HPS} h")
    raise SystemExit(0)

# 2. field id
P = STATE["project"]["id"]
q = gql("query($p:ID!){node(id:$p){... on ProjectV2{fields(first:50){nodes{... on ProjectV2Field{id name}}}}}}", p=P)
F = {f["name"]: f["id"] for f in q["node"]["fields"]["nodes"] if f}
for need in ("SWP", "Hours"):
    if need not in F: raise SystemExit(f"Project chưa có field {need}")

def setnum(item, fid, n):
    gql(f'mutation($p:ID!,$i:ID!,$f:ID!){{updateProjectV2ItemFieldValue(input:{{projectId:$p,itemId:$i,fieldId:$f,value:{{number:{n}}}}}){{projectV2Item{{id}}}}}}', p=P, i=item, f=fid)

# 3. ghi
for it in CFG["items"]:
    item = STATE["issues"][it["key"]].get("item_id")
    if not item: print("⚠ chưa có trên Project:", it["key"]); continue
    s = total(it["key"])
    setnum(item, F["SWP"], s); setnum(item, F["Hours"], s * HPS)
    print(it["key"], s, "SWP"); time.sleep(0.3)
print("\nXong.")
