#!/usr/bin/env python3
"""Tạo backlog LAB-5 lên GitHub từ lab5/backlog.json.

Cần: Python 3.9+, GitHub CLI `gh` đã đăng nhập với scope `repo` và `project`
      (chạy `gh auth refresh -s project` nếu thiếu).
Chạy:  python lab5/setup_project.py            (tạo mới / chạy tiếp phần còn dở)
       python lab5/setup_project.py --dry-run  (chỉ in ra, không gọi GitHub)

Script chạy lại được: issue đã tạo được ghi vào lab5/issue_map.json và bị bỏ qua ở lần sau.
Làm theo thứ tự:
  labels → issues → sub-issue → Project (public, link repo) → fields → thêm item → Status / Owner / Kind / Spec / Constraint.
Không đụng tới SWP / Hours / Iteration: các field này ghi ở bước sau (skill SWP, update_fields.py).
"""
import json, subprocess, sys, time, datetime, pathlib

HERE = pathlib.Path(__file__).resolve().parent
CFG = json.loads((HERE / "backlog.json").read_text(encoding="utf-8"))
MAP_F = HERE / "issue_map.json"
STATE = json.loads(MAP_F.read_text(encoding="utf-8")) if MAP_F.exists() else {"issues": {}, "sub_linked": [], "project": {}}
REPO = CFG["repo"]; OWNER = REPO.split("/")[0]
DRY = "--dry-run" in sys.argv

def nap(s):
    if not DRY: time.sleep(s)

def save():
    if DRY: return
    MAP_F.write_text(json.dumps(STATE, ensure_ascii=False, indent=1), encoding="utf-8")

def gh(args, inp=None):
    if DRY:
        print("DRY gh", " ".join(args)[:160]); return {}
    for attempt in range(5):
        r = subprocess.run(["gh"] + args, input=inp, capture_output=True, text=True, encoding="utf-8")
        if r.returncode == 0:
            return json.loads(r.stdout) if r.stdout.strip() else {}
        if "rate limit" in r.stderr.lower() or "secondary" in r.stderr.lower():
            time.sleep(30 * (attempt + 1)); continue
        raise SystemExit(f"gh {' '.join(args)[:120]}\n{r.stderr}")
    raise SystemExit("rate limit, chạy lại sau")

def gql(query, **v):
    args = ["api", "graphql", "-f", f"query={query}"]
    for k, val in v.items(): args += ["-F" if isinstance(val, (int, bool)) else "-f", f"{k}={val}"]
    return gh(args).get("data", {})

COLORS = {"epic": "5319e7", "blocked": "b60205", "constraint:完納奨励金": "d93f0b"}
# 1. labels
labels = sorted({l for it in CFG["items"] for l in it["labels"]})
for l in labels:
    if DRY: print("label", l); continue
    subprocess.run(["gh", "label", "create", l, "-R", REPO, "--force", "--color", COLORS.get(l, "c5def5")], capture_output=True)

# 2. issues
for it in CFG["items"]:
    if it["key"] in STATE["issues"]: continue
    args = ["api", f"repos/{REPO}/issues", "-f", f"title={it['title']}", "-f", f"body={it['body']}"]
    for l in it["labels"]: args += ["-f", f"labels[]={l}"]
    res = gh(args)
    STATE["issues"][it["key"]] = {"number": res.get("number", 0), "id": res.get("id", 0), "node_id": res.get("node_id", "")}
    save(); print("issue", it["key"], "#", res.get("number")); nap(0.8)

# 3. sub-issues (epic → issue → sub)
for it in CFG["items"]:
    if not it["parent"] or it["key"] in STATE["sub_linked"]: continue
    p, c = STATE["issues"][it["parent"]], STATE["issues"][it["key"]]
    gh(["api", "-X", "POST", f"repos/{REPO}/issues/{p['number']}/sub_issues", "-F", f"sub_issue_id={c['id']}"])
    STATE["sub_linked"].append(it["key"]); save(); nap(0.5)

# 4. project (public, linked to repo)
if DRY:
    print("DRY: bỏ qua Project / field / item"); raise SystemExit(0)
P = STATE["project"]
if not P.get("id"):
    owner_id = gql("query($l:String!){user(login:$l){id}}", l=OWNER)["user"]["id"]
    pr = gql("mutation($o:ID!,$t:String!){createProjectV2(input:{ownerId:$o,title:$t}){projectV2{id number url}}}", o=owner_id, t=CFG["project_title"])["createProjectV2"]["projectV2"]
    P.update(pr); save()
    repo_id = gql("query($o:String!,$n:String!){repository(owner:$o,name:$n){id}}", o=OWNER, n=REPO.split("/")[1])["repository"]["id"]
    gql("mutation($p:ID!,$r:ID!){linkProjectV2ToRepository(input:{projectId:$p,repositoryId:$r}){repository{id}}}", p=P["id"], r=repo_id)
    gql("mutation($p:ID!){updateProjectV2(input:{projectId:$p,public:true}){projectV2{public}}}", p=P["id"])

# 5. fields
def fields():
    q = gql("""query($p:ID!){node(id:$p){... on ProjectV2{fields(first:50){nodes{
      ... on ProjectV2Field{id name dataType}
      ... on ProjectV2SingleSelectField{id name dataType options{id name}}
      ... on ProjectV2IterationField{id name dataType configuration{iterations{id title startDate}}}}}}}}""", p=P["id"])
    return {f["name"]: f for f in q["node"]["fields"]["nodes"] if f} if q else {}

def opts(names):
    return "[" + ",".join(f'{{name:"{n}",color:GRAY,description:""}}' for n in names) + "]"

F = fields() if not DRY else {}
STATUS = ["Todo", "In Progress", "In Review", "Done", "Blocked"]
if not DRY:
    st = F.get("Status")
    if st and {o["name"] for o in st["options"]} != set(STATUS):
        gql(f'mutation($f:ID!){{updateProjectV2Field(input:{{fieldId:$f,singleSelectOptions:{opts(STATUS)}}}){{projectV2Field{{... on ProjectV2SingleSelectField{{id}}}}}}}}', f=st["id"])
    for name, dt in [("Owner (giả định)", "TEXT"), ("Spec", "TEXT"), ("SWP", "NUMBER"), ("Hours", "NUMBER")]:
        if name not in F:
            gql("mutation($p:ID!,$n:String!){createProjectV2Field(input:{projectId:$p,dataType:" + dt + ",name:$n}){projectV2Field{... on ProjectV2Field{id}}}}", p=P["id"], n=name)
    for name, values in [("Kind", ["EPIC", "BE", "FE", "DB", "QA", "SPEC", "INF"]), ("Constraint", ["完納奨励金", "—"])]:
        if name not in F:
            gql(f'mutation($p:ID!,$n:String!){{createProjectV2Field(input:{{projectId:$p,dataType:SINGLE_SELECT,name:$n,singleSelectOptions:{opts(values)}}}){{projectV2Field{{... on ProjectV2SingleSelectField{{id}}}}}}}}', p=P["id"], n=name)
    if "Iteration" not in F:
        start = datetime.date.fromisoformat(CFG["sprint_start"])
        its = ",".join(f'{{startDate:"{start + datetime.timedelta(days=14*i)}",duration:{CFG["sprint_days"]},title:"Sprint {i+1}"}}' for i in range(CFG["sprint_count"]))
        try:
            gql(f'mutation($p:ID!){{createProjectV2Field(input:{{projectId:$p,dataType:ITERATION,name:"Iteration",iterationConfiguration:{{startDate:"{start}",duration:{CFG["sprint_days"]},iterations:[{its}]}}}}){{projectV2Field{{... on ProjectV2IterationField{{id}}}}}}}}', p=P["id"])
        except SystemExit as e:
            print("⚠ Không tạo được field Iteration bằng API. Tạo tay trên web: Settings → + New field → Iteration,"
                  f" 2 tuần, bắt đầu {start}, {CFG['sprint_count']} sprint, tên 'Sprint N'.\n", e)
    F = fields()

# 6. add items + set fields
def setv(item, fname, value):
    f = F.get(fname)
    if not f or value in (None, ""): return
    if f["dataType"] == "SINGLE_SELECT":
        oid = next((o["id"] for o in f["options"] if o["name"] == value), None)
        if not oid: return
        v = f'{{singleSelectOptionId:"{oid}"}}'
    elif f["dataType"] == "NUMBER": v = f"{{number:{value}}}"
    else: v = '{text:' + json.dumps(value, ensure_ascii=False) + '}'
    gql(f'mutation($p:ID!,$i:ID!,$f:ID!){{updateProjectV2ItemFieldValue(input:{{projectId:$p,itemId:$i,fieldId:$f,value:{v}}}){{projectV2Item{{id}}}}}}', p=P["id"], i=item, f=f["id"])

for it in CFG["items"]:
    rec = STATE["issues"][it["key"]]
    if rec.get("item_id"): continue
    item = gql("mutation($p:ID!,$c:ID!){addProjectV2ItemById(input:{projectId:$p,contentId:$c}){item{id}}}", p=P["id"], c=rec["node_id"])
    rec["item_id"] = item.get("addProjectV2ItemById", {}).get("item", {}).get("id", "") if item else ""
    for fname, val in [("Status", it["status"]), ("Owner (giả định)", it["owner"]), ("Kind", it["kind"]),
                       ("Spec", it["spec"][:250]), ("Constraint", it["constraint"] or "—")]:
        setv(rec["item_id"], fname, val)
    save(); print("project item", it["key"]); nap(0.5)

print("\nXong. Project:", P.get("url"), "\nGửi lại file lab5/issue_map.json cho Claude (Cowork).")
