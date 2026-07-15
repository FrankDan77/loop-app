import json, os

base = "/Users/wushengyu/Develop/hustle/superset/apps/desktop/.ua/tmp"
extract = json.load(open(os.path.join(base, "ua-file-extract-results-76.json")))
dispatch = json.load(open(os.path.join(base, "dispatch-76.json")))

batch_import = dispatch["batchImportData"]
neighbor = dispatch.get("neighborMap", {})
results = extract["results"]

nodes = []
edges = []
seen_nodes = set()

def add_node(nid, ntype, label, extra=None):
    if nid in seen_nodes:
        return
    seen_nodes.add(nid)
    n = {"id": nid, "type": ntype, "label": label}
    if extra:
        n.update(extra)
    nodes.append(n)

def add_edge(src, dst, etype, weight):
    edges.append({"source": src, "target": dst, "type": etype, "weight": weight})

# Track functions per file for calls resolution
funcs_by_file = {}
func_names_by_file = {}

# Build file + function/class nodes
for r in results:
    path = r["path"]
    fid = f"file:{path}"
    add_node(fid, "file", os.path.basename(path), {
        "path": path,
        "language": r.get("language"),
        "sizeLines": r.get("totalLines"),
    })
    funcs_by_file[path] = set()
    func_names_by_file[path] = set()
    # functions
    for fn in r.get("functions", []):
        name = fn["name"]
        func_id = f"function:{path}:{name}"
        add_node(func_id, "function", name, {
            "path": path,
            "startLine": fn.get("startLine"),
            "endLine": fn.get("endLine"),
        })
        add_edge(fid, func_id, "contains", 1.0)
        funcs_by_file[path].add(func_id)
        func_names_by_file[path].add(name)
    # classes
    for cl in r.get("classes", []):
        name = cl["name"]
        cls_id = f"class:{path}:{name}"
        add_node(cls_id, "class", name, {"path": path})
        add_edge(fid, cls_id, "contains", 1.0)

# Exports edges (file -> function/class node when export matches a defined symbol)
for r in results:
    path = r["path"]
    fid = f"file:{path}"
    for ex in r.get("exports", []):
        name = ex["name"]
        if name in func_names_by_file.get(path, set()):
            add_edge(fid, f"function:{path}:{name}", "exports", 0.8)

# Imports edges (ALL from batchImportData): file -> file
for src_path, imported in batch_import.items():
    src_id = f"file:{src_path}"
    for dst_path in imported:
        add_edge(src_id, f"file:{dst_path}", "imports", 0.7)

# Calls edges: function -> function within the same file (internal calls)
for r in results:
    path = r["path"]
    local_funcs = func_names_by_file.get(path, set())
    for cg in r.get("callGraph", []):
        caller = cg["caller"]
        callee = cg["callee"]
        # only resolve simple internal calls to sibling functions in same file
        if caller in local_funcs and callee in local_funcs and caller != callee:
            add_edge(
                f"function:{path}:{caller}",
                f"function:{path}:{callee}",
                "calls",
                0.8,
            )

# tested_by edges (source file tested_by test file) weight 0.5
# A *.test.ts importing a source file within the batch implies test relationship
for src_path, imported in batch_import.items():
    if src_path.endswith(".test.ts") or src_path.endswith(".test.tsx"):
        for dst_path in imported:
            if f"file:{dst_path}" in seen_nodes:
                add_edge(f"file:{dst_path}", f"file:{src_path}", "tested_by", 0.5)

# depends_on edges (0.6): function -> external file whose exported symbol it calls,
# resolved via neighborMap symbol table (cross-file dependency)
sym_index = {}  # symbol -> set of neighbor file paths (that are in this batch)
for src_path, nbrs in neighbor.items():
    for nb in nbrs:
        for sym in nb.get("symbols", []):
            sym_index.setdefault((src_path, sym), nb["path"])

for r in results:
    path = r["path"]
    local_funcs = func_names_by_file.get(path, set())
    dep_seen = set()
    for cg in r.get("callGraph", []):
        caller = cg["caller"]
        callee = cg["callee"]
        if caller not in local_funcs:
            continue
        # strip member access to get base symbol
        base_sym = callee.split(".")[0].split("(")[0].strip()
        target_path = sym_index.get((path, base_sym))
        if target_path and target_path != path:
            key = (caller, target_path)
            if key not in dep_seen:
                dep_seen.add(key)
                add_edge(
                    f"function:{path}:{caller}",
                    f"file:{target_path}",
                    "depends_on",
                    0.6,
                )

out = {
    "batchIndex": 76,
    "totalBatches": 117,
    "nodes": nodes,
    "edges": edges,
    "stats": {
        "nodeCount": len(nodes),
        "edgeCount": len(edges),
        "fileNodes": sum(1 for n in nodes if n["type"] == "file"),
        "functionNodes": sum(1 for n in nodes if n["type"] == "function"),
        "classNodes": sum(1 for n in nodes if n["type"] == "class"),
    },
}
json.dump(out, open(os.path.join(base, "batch-76.json"), "w"), indent=2)
from collections import Counter
ec = Counter(e["type"] for e in edges)
print("nodes:", len(nodes), out["stats"])
print("edges:", len(edges), dict(ec))
