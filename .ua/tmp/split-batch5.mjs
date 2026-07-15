import fs from "node:fs";

const UA = "/Users/wushengyu/Develop/hustle/superset/.ua";
const input = JSON.parse(
	fs.readFileSync(`${UA}/tmp/ua-file-analyzer-input-5.json`, "utf8"),
);
const full = JSON.parse(fs.readFileSync(`${UA}/tmp/batch5-full.json`, "utf8"));

const paths = input.batchFiles.map((f) => f.path).sort();
const PARTS = 2;
const size = Math.ceil(paths.length / PARTS);
const groups = [];
for (let i = 0; i < PARTS; i++) {
	groups.push(new Set(paths.slice(i * size, (i + 1) * size)));
}

// Map each node to a group by its filePath (file/function nodes both carry filePath)
const nodeGroup = new Map();
for (const n of full.nodes) {
	const fp = n.filePath;
	if (!fp) throw new Error(`node missing filePath: ${n.id}`);
	let g = -1;
	for (let i = 0; i < PARTS; i++) {
		if (groups[i].has(fp)) {
			g = i;
			break;
		}
	}
	if (g === -1) throw new Error(`file not in any group: ${fp}`);
	nodeGroup.set(n.id, g);
}

const partNodes = Array.from({ length: PARTS }, () => []);
const partEdges = Array.from({ length: PARTS }, () => []);

for (const n of full.nodes) {
	partNodes[nodeGroup.get(n.id)].push(n);
}

for (const e of full.edges) {
	// partition by source's group (per Step C: edges whose source is in this part's nodes)
	const g = nodeGroup.get(e.source);
	if (g === undefined)
		throw new Error(`edge source not in batch nodes: ${e.source}`);
	partEdges[g].push(e);
}

for (let i = 0; i < PARTS; i++) {
	const partNum = i + 1;
	const out = { nodes: partNodes[i], edges: partEdges[i] };
	fs.writeFileSync(
		`${UA}/intermediate/batch-5-part-${partNum}.json`,
		JSON.stringify(out, null, 2),
	);
	console.log(
		`part ${partNum}: nodes=${partNodes[i].length} edges=${partEdges[i].length}`,
	);
}
