const fs = require("node:fs");

const dispatch = JSON.parse(fs.readFileSync("dispatch-47.json", "utf8"));
const results = JSON.parse(
	fs.readFileSync("ua-file-extract-results-47.json", "utf8"),
);

const nodes = [];
const edges = [];

// Process each file
for (const fileResult of results.results) {
	const filePath = fileResult.path;
	const fileId = `file:${filePath}`;

	// Create file node
	nodes.push({
		id: fileId,
		type: "file",
		name: filePath.split("/").pop(),
		path: filePath,
		language: fileResult.language,
		category: fileResult.fileCategory,
		metrics: fileResult.metrics,
	});

	// Create function nodes
	if (fileResult.functions) {
		for (const func of fileResult.functions) {
			const funcId = `function:${filePath}:${func.name}`;
			nodes.push({
				id: funcId,
				type: "function",
				name: func.name,
				path: filePath,
				startLine: func.startLine,
				endLine: func.endLine,
				params: func.params,
			});

			// contains edge: file -> function
			edges.push({
				source: fileId,
				target: funcId,
				type: "contains",
				weight: 1.0,
			});
		}
	}

	// Create class nodes (if any)
	if (fileResult.classes) {
		for (const cls of fileResult.classes) {
			const clsId = `class:${filePath}:${cls.name}`;
			nodes.push({
				id: clsId,
				type: "class",
				name: cls.name,
				path: filePath,
				startLine: cls.startLine,
				endLine: cls.endLine,
			});

			// contains edge: file -> class
			edges.push({
				source: fileId,
				target: clsId,
				type: "contains",
				weight: 1.0,
			});
		}
	}

	// exports edges
	if (fileResult.exports) {
		for (const exp of fileResult.exports) {
			const targetId = `function:${filePath}:${exp.name}`;
			const funcExists = nodes.some((n) => n.id === targetId);

			if (funcExists) {
				edges.push({
					source: fileId,
					target: targetId,
					type: "exports",
					weight: 0.8,
				});
			} else {
				// Export might be a constant or type, create a generic symbol node
				const symbolId = `symbol:${filePath}:${exp.name}`;
				if (!nodes.some((n) => n.id === symbolId)) {
					nodes.push({
						id: symbolId,
						type: "symbol",
						name: exp.name,
						path: filePath,
						line: exp.line,
					});
				}
				edges.push({
					source: fileId,
					target: symbolId,
					type: "exports",
					weight: 0.8,
				});
			}
		}
	}

	// calls edges from callGraph
	if (fileResult.callGraph) {
		for (const call of fileResult.callGraph) {
			const callerId = `function:${filePath}:${call.caller}`;

			// Check if caller is a known function in this file
			if (nodes.some((n) => n.id === callerId)) {
				// Create a simplified callee identifier
				// callees can be external or internal
				let calleeId;

				// Simple heuristic: if callee looks like a simple function name,
				// it might be in the same file
				const simpleCallee = call.callee.split(".")[0].split("(")[0];
				const possibleCalleeId = `function:${filePath}:${simpleCallee}`;

				if (nodes.some((n) => n.id === possibleCalleeId)) {
					calleeId = possibleCalleeId;
				} else {
					// External or method call - create a reference node
					calleeId = `ref:${call.callee}`;
					if (!nodes.some((n) => n.id === calleeId)) {
						nodes.push({
							id: calleeId,
							type: "reference",
							name: call.callee,
						});
					}
				}

				edges.push({
					source: callerId,
					target: calleeId,
					type: "calls",
					weight: 0.8,
					line: call.lineNumber,
				});
			}
		}
	}
}

// Add imports edges from batchImportData
for (const [sourceFile, imports] of Object.entries(dispatch.batchImportData)) {
	const sourceId = `file:${sourceFile}`;

	for (const importPath of imports) {
		const targetId = `file:${importPath}`;

		edges.push({
			source: sourceId,
			target: targetId,
			type: "imports",
			weight: 0.7,
		});
	}
}

// Add tested_by edges (detect test files)
for (const fileResult of results.results) {
	const filePath = fileResult.path;

	if (filePath.includes(".test.") || filePath.includes(".spec.")) {
		// This is a test file, find what it tests
		const testedPath = filePath
			.replace(".test.ts", ".ts")
			.replace(".test.tsx", ".tsx")
			.replace(".spec.ts", ".ts")
			.replace(".spec.tsx", ".tsx");

		const testFileId = `file:${filePath}`;
		const testedFileId = `file:${testedPath}`;

		// Check if tested file exists in imports
		const imports = dispatch.batchImportData[filePath] || [];
		if (imports.includes(testedPath)) {
			edges.push({
				source: testFileId,
				target: testedFileId,
				type: "tested_by",
				weight: 0.5,
			});
		}
	}
}

// Add depends_on edges from neighborMap (cross-batch dependencies)
for (const [sourceFile, neighbors] of Object.entries(dispatch.neighborMap)) {
	const sourceId = `file:${sourceFile}`;

	for (const neighbor of neighbors) {
		const targetId = `file:${neighbor.path}`;

		// Only add if not already covered by imports
		const hasImport = edges.some(
			(e) =>
				e.source === sourceId && e.target === targetId && e.type === "imports",
		);

		if (!hasImport) {
			edges.push({
				source: sourceId,
				target: targetId,
				type: "depends_on",
				weight: 0.6,
				symbols: neighbor.symbols,
			});
		}
	}
}

const output = {
	batchIndex: dispatch.batchIndex,
	totalBatches: dispatch.totalBatches,
	fileCount: dispatch.files.length,
	nodeCount: nodes.length,
	edgeCount: edges.length,
	nodes,
	edges,
};

fs.writeFileSync("batch-47.json", JSON.stringify(output, null, 2));

console.log(`Batch 47 processed:`);
console.log(`- Files: ${output.fileCount}`);
console.log(`- Nodes: ${output.nodeCount}`);
console.log(`- Edges: ${output.edgeCount}`);
console.log(
	`- Node types: ${[...new Set(nodes.map((n) => n.type))].join(", ")}`,
);
console.log(
	`- Edge types: ${[...new Set(edges.map((e) => e.type))].join(", ")}`,
);
