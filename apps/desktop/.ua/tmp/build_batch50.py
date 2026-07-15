import json

results = json.load(open('ua-file-extract-results-50.json'))['results']
dispatch = json.load(open('dispatch-50.json'))
batch_imports = dispatch['batchImportData']
neighbor_map = dispatch.get('neighborMap', {})

nodes = []
edges = []
node_ids = set()

def add_node(nid, ntype, **attrs):
    if nid in node_ids:
        return
    node_ids.add(nid)
    n = {"id": nid, "type": ntype}
    n.update(attrs)
    nodes.append(n)

def add_edge(src, dst, etype, weight):
    edges.append({"from": src, "to": dst, "type": etype, "weight": weight})

# per-file symbol tables for call resolution
file_funcs = {}   # path -> {name: node_id}
file_classes = {} # path -> {name: node_id}
file_methods = {} # path -> {method_name: class_node_id}

batch_paths = {r['path'] for r in results}

# Pass 1: create file, function, class nodes
for r in results:
    path = r['path']
    fid = f"file:{path}"
    add_node(fid, "file",
             path=path,
             language=r.get('language'),
             fileCategory=r.get('fileCategory'),
             totalLines=r.get('totalLines'),
             isTest=path.endswith('.test.ts'))
    file_funcs[path] = {}
    file_classes[path] = {}
    file_methods[path] = {}

    for fn in r.get('functions', []):
        name = fn['name']
        nid = f"function:{path}:{name}"
        add_node(nid, "function", path=path, name=name,
                 startLine=fn.get('startLine'), endLine=fn.get('endLine'),
                 params=fn.get('params', []))
        file_funcs[path][name] = nid
        add_edge(fid, nid, "contains", 1.0)

    for cls in r.get('classes', []):
        name = cls['name']
        nid = f"class:{path}:{name}"
        add_node(nid, "class", path=path, name=name,
                 startLine=cls.get('startLine'), endLine=cls.get('endLine'),
                 methods=cls.get('methods', []), properties=cls.get('properties', []))
        file_classes[path][name] = nid
        add_edge(fid, nid, "contains", 1.0)
        for m in cls.get('methods', []):
            file_methods[path].setdefault(m, nid)

# Pass 2: exports edges (only for symbols with function/class nodes)
for r in results:
    path = r['path']
    fid = f"file:{path}"
    for exp in r.get('exports', []):
        name = exp['name']
        tgt = file_funcs[path].get(name) or file_classes[path].get(name)
        if tgt:
            add_edge(fid, tgt, "exports", 0.8)

# Pass 3: imports edges (ALL from batchImportData)
for src_path, imports in batch_imports.items():
    src = f"file:{src_path}"
    if src not in node_ids:
        add_node(src, "file", path=src_path)
    for imp in imports:
        dst = f"file:{imp}"
        if dst not in node_ids:
            # external/other-batch file: create stub node
            add_node(dst, "file", path=imp, external=(imp not in batch_paths))
        add_edge(src, dst, "imports", 0.7)

# Pass 4: calls edges (resolve caller & callee within same file)
for r in results:
    path = r['path']
    funcs = file_funcs[path]
    classes = file_classes[path]
    methods = file_methods[path]
    for call in r.get('callGraph', []):
        caller = call.get('caller')
        callee = call.get('callee')
        # resolve caller node
        src = None
        if caller in funcs:
            src = funcs[caller]
        elif caller in methods:
            src = methods[caller]
        # resolve callee node (only exact local func/class match)
        dst = None
        if callee in funcs:
            dst = funcs[callee]
        elif callee in classes:
            dst = classes[callee]
        if src and dst and src != dst:
            add_edge(src, dst, "calls", 0.8)

# Pass 5: tested_by edges (test file imports impl file in batch)
for src_path, imports in batch_imports.items():
    if not src_path.endswith('.test.ts'):
        continue
    test_node = f"file:{src_path}"
    for imp in imports:
        if imp.endswith('.test.ts'):
            continue
        if imp in batch_paths:
            add_edge(f"file:{imp}", test_node, "tested_by", 0.5)

# Pass 6: depends_on edges (from neighborMap)
for src_path, neighbors in neighbor_map.items():
    src = f"file:{src_path}"
    if src not in node_ids:
        add_node(src, "file", path=src_path)
    seen = set()
    for nb in neighbors:
        npath = nb['path']
        if npath == src_path or npath in seen:
            continue
        seen.add(npath)
        dst = f"file:{npath}"
        if dst not in node_ids:
            add_node(dst, "file", path=npath, external=(npath not in batch_paths))
        add_edge(src, dst, "depends_on", 0.6)

# dedupe edges
uniq = {}
for e in edges:
    k = (e['from'], e['to'], e['type'])
    uniq[k] = e
edges = list(uniq.values())

out = {
    "batchIndex": 50,
    "totalBatches": 117,
    "nodeCount": len(nodes),
    "edgeCount": len(edges),
    "nodes": nodes,
    "edges": edges,
}
json.dump(out, open('batch-50.json', 'w'), indent=None)

from collections import Counter
ntypes = Counter(n['type'] for n in nodes)
etypes = Counter(e['type'] for e in edges)
import os
print("nodes:", len(nodes), dict(ntypes))
print("edges:", len(edges), dict(etypes))
print("bytes:", os.path.getsize('batch-50.json'))
