#!/usr/bin/env python3
"""Ghi Iteration + Status GIẢ LẬP lên GitHub Project (chạy sau update_fields.py).

Đầu vào (cùng thư mục):
  backlog.json, issue_map.json
  sprint_plan.json  — task lá → sprint (Sprint 1–4 được ghi; từ Sprint 5 để trống)
  sim_sprint3.json  — kịch bản giả lập tại cuối Sprint 3 (18/12/2026), PL duyệt 2026-10-23
Quy tắc Status:
  - Task lá: Sprint 1–2 Done; Sprint 3 theo kịch bản; Sprint 4 Todo; Blocked giữ nguyên; còn lại Todo.
  - Issue cha / epic: Blocked nếu mọi con Blocked; Done nếu mọi con Done;
    In Progress nếu có con đã bắt đầu (Done / In Progress / In Review); còn lại Todo.
Chạy:  python3 set_sprint.py [--dry-run]
"""
import json, subprocess, sys, time, pathlib

HERE = pathlib.Path(__file__).resolve().parent
ld = lambda f: json.loads((HERE / f).read_text(encoding="utf-8"))
CFG, STATE, PLAN, SIM = ld("backlog.json"), ld("issue_map.json"), ld("sprint_plan.json")["plan"], ld("sim_sprint3.json")
DRY = "--dry-run" in sys.argv
MAX_SPRINT = 4

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

# 1. tính status / iteration
kids = {}
for it in CFG["items"]:
    if it["parent"]: kids.setdefault(it["parent"], []).append(it["key"])
base = {it["key"]: it["status"] for it in CFG["items"]}
status, iteration = {}, {}
for it in CFG["items"]:
    k = it["key"]
    if k in kids: continue
    sp = PLAN.get(k)
    if base[k] == "Blocked": status[k] = "Blocked"
    elif sp and sp <= MAX_SPRINT:
        iteration[k] = f"Sprint {sp}"
        status[k] = SIM["sprint3_status"].get(k, "Done") if sp == 3 else SIM["status_by_sprint"][str(sp)]
    else: status[k] = "Todo"

def roll(k):
    if k in status: return status[k]
    st = [roll(c) for c in kids[k]]
    if all(s == "Blocked" for s in st): r = "Blocked"
    elif all(s == "Done" for s in st): r = "Done"
    elif any(s in ("Done", "In Progress", "In Review") for s in st): r = "In Progress"
    else: r = "Todo"
    status[k] = r; return r
for it in CFG["items"]: roll(it["key"])

from collections import Counter
print("Status:", dict(Counter(status.values())), "· Iteration:", dict(Counter(iteration.values())))
if DRY:
    for it in CFG["items"]:
        if it["level"] == "epic": print(" ", it["key"], status[it["key"]])
    raise SystemExit(0)

# 2. field
P = STATE["project"]["id"]
q = gql("""query($p:ID!){node(id:$p){... on ProjectV2{fields(first:50){nodes{
  ... on ProjectV2SingleSelectField{id name options{id name}}
  ... on ProjectV2IterationField{id name configuration{iterations{id title}}}}}}}}""", p=P)
F = {f["name"]: f for f in q["node"]["fields"]["nodes"] if f}
opt = {o["name"]: o["id"] for o in F["Status"]["options"]}
its = {i["title"]: i["id"] for i in F["Iteration"]["configuration"]["iterations"]} if "Iteration" in F else {}
if not its: print("⚠ Không thấy field Iteration — chỉ ghi Status. Tạo field Iteration rồi chạy lại.")

def setv(item, fid, value):
    gql(f'mutation($p:ID!,$i:ID!,$f:ID!){{updateProjectV2ItemFieldValue(input:{{projectId:$p,itemId:$i,fieldId:$f,value:{value}}}){{projectV2Item{{id}}}}}}', p=P, i=item, f=fid)

# 3. ghi
for it in CFG["items"]:
    k = it["key"]; item = STATE["issues"][k]["item_id"]
    setv(item, F["Status"]["id"], f'{{singleSelectOptionId:"{opt[status[k]]}"}}')
    if k in iteration and iteration[k] in its:
        setv(item, F["Iteration"]["id"], f'{{iterationId:"{its[iteration[k]]}"}}')
    print(k, status[k], iteration.get(k, "")); time.sleep(0.3)
print("\nXong.")
