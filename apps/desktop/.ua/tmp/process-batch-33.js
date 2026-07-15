const fs = require("node:fs");

const extractResults = JSON.parse(
	fs.readFileSync("ua-file-extract-results-33.json", "utf8"),
);
const dispatch = JSON.parse(fs.readFileSync("dispatch-33.json", "utf8"));

const nodes = [];
const edges = [];
const nodeIds = new Set();

function addNode(id, type, properties = {}) {
	if (!nodeIds.has(id)) {
		nodes.push({ id, type, ...properties });
		nodeIds.add(id);
	}
}

function addEdge(from, to, type, weight) {
	edges.push({ from, to, type, weight });
}

// Process each file
for (const file of extractResults.results) {
	const filePath = file.path;
	const fileId = `file:${filePath}`;

	// Add file node
	addNode(fileId, "file", {
		path: filePath,
		language: file.language,
		category: file.fileCategory,
		totalLines: file.totalLines,
		nonEmptyLines: file.nonEmptyLines,
		metrics: file.metrics,
	});

	// Add function nodes and contains edges
	if (file.functions) {
		for (const func of file.functions) {
			const funcId = `function:${filePath}:${func.name}`;
			addNode(funcId, "function", {
				name: func.name,
				startLine: func.startLine,
				endLine: func.endLine,
				params: func.params,
			});
			addEdge(fileId, funcId, "contains", 1.0);
		}
	}

	// Add class nodes and contains edges
	if (file.classes) {
		for (const cls of file.classes) {
			const clsId = `class:${filePath}:${cls.name}`;
			addNode(clsId, "class", {
				name: cls.name,
				startLine: cls.startLine,
				endLine: cls.endLine,
			});
			addEdge(fileId, clsId, "contains", 1.0);
		}
	}

	// Add export edges
	if (file.exports) {
		for (const exp of file.exports) {
			const exportTarget = exp.name;
			// Check if it's a function or class we've seen
			const funcId = `function:${filePath}:${exportTarget}`;
			const clsId = `class:${filePath}:${exportTarget}`;

			if (nodeIds.has(funcId)) {
				addEdge(fileId, funcId, "exports", 0.8);
			} else if (nodeIds.has(clsId)) {
				addEdge(fileId, clsId, "exports", 0.8);
			} else {
				// It's a generic export (type, const, etc.)
				addEdge(fileId, `export:${filePath}:${exportTarget}`, "exports", 0.8);
			}
		}
	}

	// Add call edges from callGraph
	if (file.callGraph) {
		for (const call of file.callGraph) {
			const callerId = `function:${filePath}:${call.caller}`;
			// For callee, we try to determine if it's internal or external
			// Most callees won't have full paths, so we just record the relationship
			if (nodeIds.has(callerId)) {
				addEdge(callerId, `call:${call.callee}`, "calls", 0.8);
			}
		}
	}

	// Add import edges from batchImportData
	const imports = dispatch.batchImportData[filePath] || [];
	for (const importPath of imports) {
		const targetFileId = `file:${importPath}`;
		addEdge(fileId, targetFileId, "imports", 0.7);
		addEdge(fileId, targetFileId, "depends_on", 0.6);
	}

	// Add tested_by edges for test files
	if (filePath.includes(".test.") || filePath.includes(".spec.")) {
		const testedPath = filePath
			.replace(".test.ts", ".ts")
			.replace(".test.tsx", ".tsx")
			.replace(".spec.ts", ".ts")
			.replace(".spec.tsx", ".tsx");
		const testedFileId = `file:${testedPath}`;
		addEdge(testedFileId, fileId, "tested_by", 0.5);
	}
}

// Create output
const output = {
	batchIndex: dispatch.batchIndex,
	totalBatches: dispatch.totalBatches,
	fileCount: extractResults.filesAnalyzed,
	nodes,
	edges,
	metadata: {
		nodeCount: nodes.length,
		edgeCount: edges.length,
		nodeTypes: {
			file: nodes.filter((n) => n.type === "file").length,
			function: nodes.filter((n) => n.type === "function").length,
			class: nodes.filter((n) => n.type === "class").length,
		},
		edgeTypes: {
			contains: edges.filter((e) => e.type === "contains").length,
			imports: edges.filter((e) => e.type === "imports").length,
			exports: edges.filter((e) => e.type === "exports").length,
			calls: edges.filter((e) => e.type === "calls").length,
			tested_by: edges.filter((e) => e.type === "tested_by").length,
			depends_on: edges.filter((e) => e.type === "depends_on").length,
		},
	},
};

fs.writeFileSync("batch-33.json", JSON.stringify(output, null, 2));

console.log(`Processed batch ${output.batchIndex}/${output.totalBatches}`);
console.log(
	`Created ${output.metadata.nodeCount} nodes and ${output.metadata.edgeCount} edges`,
);
console.log(`Node types: ${JSON.stringify(output.metadata.nodeTypes)}`);
console.log(`Edge types: ${JSON.stringify(output.metadata.edgeTypes)}`);
