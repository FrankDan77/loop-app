const fs = require("node:fs");

const dispatch = JSON.parse(fs.readFileSync("dispatch-34.json", "utf8"));
const results = JSON.parse(
	fs.readFileSync("ua-file-extract-results-34.json", "utf8"),
);

const nodes = [];
const edges = [];

// Helper to create node
function addNode(id, type, properties = {}) {
	nodes.push({ id, type, ...properties });
}

// Helper to create edge
function addEdge(from, to, type, weight) {
	edges.push({ from, to, type, weight });
}

// Process each file result
for (const fileResult of results.results) {
	const filePath = fileResult.path;
	const fileId = `file:${filePath}`;

	// Create file node
	addNode(fileId, "file", {
		path: filePath,
		language: fileResult.language,
		category: fileResult.fileCategory,
		totalLines: fileResult.totalLines,
		nonEmptyLines: fileResult.nonEmptyLines,
		metrics: fileResult.metrics,
	});

	// Create function nodes
	if (fileResult.functions) {
		for (const func of fileResult.functions) {
			const funcId = `function:${filePath}:${func.name}`;
			addNode(funcId, "function", {
				name: func.name,
				startLine: func.startLine,
				endLine: func.endLine,
				params: func.params,
			});

			// contains edge: file contains function
			addEdge(fileId, funcId, "contains", 1.0);
		}
	}

	// Create class nodes (if any)
	if (fileResult.classes) {
		for (const cls of fileResult.classes) {
			const clsId = `class:${filePath}:${cls.name}`;
			addNode(clsId, "class", {
				name: cls.name,
				startLine: cls.startLine,
				endLine: cls.endLine,
			});

			// contains edge: file contains class
			addEdge(fileId, clsId, "contains", 1.0);
		}
	}

	// Create export edges
	if (fileResult.exports) {
		for (const exp of fileResult.exports) {
			const exportName = exp.name;
			// Export edge from file to exported symbol (target can be function or other)
			const targetId = `function:${filePath}:${exportName}`;
			// Check if function exists
			const funcExists = fileResult.functions?.some(
				(f) => f.name === exportName,
			);
			if (funcExists) {
				addEdge(fileId, targetId, "exports", 0.8);
			} else {
				// Could be a constant or type export
				addEdge(fileId, `symbol:${filePath}:${exportName}`, "exports", 0.8);
			}
		}
	}

	// Create call edges from callGraph
	if (fileResult.callGraph) {
		for (const call of fileResult.callGraph) {
			const callerId = `function:${filePath}:${call.caller}`;
			const calleeId = `function:${filePath}:${call.callee}`;
			addEdge(callerId, calleeId, "calls", 0.8);
		}
	}
}

// Create import edges from batchImportData
const batchImportData = dispatch.batchImportData || {};
for (const [sourceFile, imports] of Object.entries(batchImportData)) {
	const sourceId = `file:${sourceFile}`;
	for (const targetFile of imports) {
		const targetId = `file:${targetFile}`;
		addEdge(sourceId, targetId, "imports", 0.7);
	}
}

// Create tested_by edges for test files
for (const fileResult of results.results) {
	const filePath = fileResult.path;
	if (filePath.includes(".test.") || filePath.includes(".spec.")) {
		// Extract the tested file path
		const testedPath = filePath
			.replace(/\.(test|spec)\.tsx?$/, ".tsx")
			.replace(/\.(test|spec)\.tsx?$/, ".ts");
		const testFileId = `file:${filePath}`;
		const testedFileId = `file:${testedPath}`;
		addEdge(testFileId, testedFileId, "tested_by", 0.5);
	}
}

// Create depends_on edges from neighborMap
const neighborMap = dispatch.neighborMap || {};
for (const [sourceFile, neighbors] of Object.entries(neighborMap)) {
	const sourceId = `file:${sourceFile}`;
	if (neighbors && Array.isArray(neighbors)) {
		for (const neighbor of neighbors) {
			if (neighbor.path) {
				const targetId = `file:${neighbor.path}`;
				addEdge(sourceId, targetId, "depends_on", 0.6);
			}
		}
	}
}

// Output
const output = {
	batch: 34,
	totalBatches: 117,
	nodeCount: nodes.length,
	edgeCount: edges.length,
	nodes,
	edges,
};

fs.writeFileSync("batch-34.json", JSON.stringify(output, null, 2));
console.log(`Batch 34 processed: ${nodes.length} nodes, ${edges.length} edges`);
