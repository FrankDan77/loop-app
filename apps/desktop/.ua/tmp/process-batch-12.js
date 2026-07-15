const fs = require("node:fs");

const extractResults = JSON.parse(
	fs.readFileSync("ua-file-extract-results-12.json", "utf8"),
);
const dispatch = JSON.parse(fs.readFileSync("dispatch-12.json", "utf8"));

const nodes = [];
const edges = [];
const { results } = extractResults;
const { batchImportData } = dispatch;

// Helper to create IDs
const fileId = (path) => `file:${path}`;
const functionId = (path, name) => `function:${path}:${name}`;
const classId = (path, name) => `class:${path}:${name}`;

// Helper to calculate complexity
const calculateComplexity = (func) => {
	if (!func) return 1;
	const lines = func.endLine - func.startLine + 1;
	if (lines > 100) return 5;
	if (lines > 50) return 4;
	if (lines > 20) return 3;
	if (lines > 10) return 2;
	return 1;
};

// Process each file
for (const file of results) {
	const path = file.path;

	// Determine node type
	let nodeType = "file";
	if (file.fileCategory === "config") nodeType = "config";
	else if (file.fileCategory === "docs") nodeType = "document";

	// Determine tags
	const tags = [file.language, file.fileCategory];
	if (path.includes("/components/")) tags.push("component");
	if (path.includes("/hooks/")) tags.push("hook");
	if (path.endsWith("index.ts") || path.endsWith("index.tsx"))
		tags.push("barrel");
	if (path.includes("/registry/")) tags.push("registry");

	// Create file node
	nodes.push({
		id: fileId(path),
		type: nodeType,
		name: path.split("/").pop(),
		filePath: path,
		summary: `${file.fileCategory} file with ${file.metrics.exportCount} exports, ${file.metrics.functionCount} functions`,
		tags: tags.filter((v, i, a) => a.indexOf(v) === i),
		complexity: Math.min(5, Math.max(1, Math.floor(file.nonEmptyLines / 30))),
	});

	// Process functions - significant if 10+ lines OR exported
	if (file.functions) {
		for (const func of file.functions) {
			const lines = func.endLine - func.startLine + 1;
			const isExported = file.exports?.some((e) => e.name === func.name);

			if (lines >= 10 || isExported) {
				nodes.push({
					id: functionId(path, func.name),
					type: "function",
					name: func.name,
					filePath: path,
					summary: `Function spanning lines ${func.startLine}-${func.endLine} (${lines} lines)${isExported ? ", exported" : ""}`,
					tags: [
						file.language,
						isExported ? "exported" : "internal",
						func.name.startsWith("use") ? "hook" : "function",
					],
					complexity: calculateComplexity(func),
					lineRange: [func.startLine, func.endLine],
				});

				// contains edge
				edges.push({
					from: fileId(path),
					to: functionId(path, func.name),
					type: "contains",
					weight: 1.0,
				});

				// exports edge
				if (isExported) {
					edges.push({
						from: functionId(path, func.name),
						to: fileId(path),
						type: "exports",
						weight: 0.8,
					});
				}
			}
		}
	}

	// Process classes - significant if 10+ lines OR exported
	if (file.classes) {
		for (const cls of file.classes) {
			const lines = cls.endLine - cls.startLine + 1;
			const isExported = file.exports?.some((e) => e.name === cls.name);

			if (lines >= 10 || isExported) {
				nodes.push({
					id: classId(path, cls.name),
					type: "class",
					name: cls.name,
					filePath: path,
					summary: `Class spanning lines ${cls.startLine}-${cls.endLine} (${lines} lines)${isExported ? ", exported" : ""}`,
					tags: [file.language, isExported ? "exported" : "internal", "class"],
					complexity: calculateComplexity(cls),
					lineRange: [cls.startLine, cls.endLine],
				});

				// contains edge
				edges.push({
					from: fileId(path),
					to: classId(path, cls.name),
					type: "contains",
					weight: 1.0,
				});

				// exports edge
				if (isExported) {
					edges.push({
						from: classId(path, cls.name),
						to: fileId(path),
						type: "exports",
						weight: 0.8,
					});
				}
			}
		}
	}

	// Process call graph
	if (file.callGraph) {
		for (const call of file.callGraph) {
			const fromId = functionId(path, call.caller);
			// Only create call edge if the caller function node exists
			if (nodes.some((n) => n.id === fromId)) {
				// Simple call edge - we don't know where callee is defined
				edges.push({
					from: fromId,
					to: call.callee,
					type: "calls",
					weight: 0.8,
					lineNumber: call.lineNumber,
				});
			}
		}
	}
}

// Process imports from batchImportData
for (const [filePath, imports] of Object.entries(batchImportData)) {
	const fromId = fileId(filePath);
	for (const importPath of imports) {
		const toId = fileId(importPath);
		// Only create import edge if target exists in this batch
		if (nodes.some((n) => n.id === toId)) {
			edges.push({
				from: fromId,
				to: toId,
				type: "imports",
				weight: 0.7,
			});
		}
	}
}

// Process depends_on edges (from external imports)
for (const [filePath, imports] of Object.entries(batchImportData)) {
	const fromId = fileId(filePath);
	for (const importPath of imports) {
		const toId = fileId(importPath);
		// Create depends_on for external files (not in this batch)
		if (!nodes.some((n) => n.id === toId)) {
			edges.push({
				from: fromId,
				to: toId,
				type: "depends_on",
				weight: 0.6,
			});
		}
	}
}

console.log(`Generated ${nodes.length} nodes and ${edges.length} edges`);

// Check if we need to split
const shouldSplit = nodes.length > 60 || edges.length > 120;

if (shouldSplit) {
	// Split into parts
	const nodesPerPart = 50;
	const edgesPerPart = 100;

	let partIndex = 1;
	let nodeOffset = 0;

	while (nodeOffset < nodes.length) {
		const partNodes = nodes.slice(nodeOffset, nodeOffset + nodesPerPart);
		const nodeIds = new Set(partNodes.map((n) => n.id));

		// Include edges that reference nodes in this part
		const partEdges = edges
			.filter((e) => nodeIds.has(e.from) || nodeIds.has(e.to))
			.slice(0, edgesPerPart);

		const output = { nodes: partNodes, edges: partEdges };
		fs.writeFileSync(
			`batch-12-part-${partIndex}.json`,
			JSON.stringify(output, null, 2),
		);
		console.log(
			`Written batch-12-part-${partIndex}.json with ${partNodes.length} nodes and ${partEdges.length} edges`,
		);

		nodeOffset += nodesPerPart;
		partIndex++;
	}
} else {
	// Single file output
	const output = { nodes, edges };
	fs.writeFileSync("batch-12.json", JSON.stringify(output, null, 2));
	console.log(`Written batch-12.json`);
}
