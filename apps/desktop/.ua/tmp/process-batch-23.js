const fs = require("node:fs");
const path = require("node:path");

// Read input files
const extractResults = JSON.parse(
	fs.readFileSync(
		path.join(__dirname, "ua-file-extract-results-23.json"),
		"utf8",
	),
);
const dispatch = JSON.parse(
	fs.readFileSync(path.join(__dirname, "dispatch-23.json"), "utf8"),
);

const nodes = [];
const edges = [];
const { results } = extractResults;
const { batchImportData } = dispatch;

// Helper to determine complexity
function getComplexity(lines, functionCount, _classCount, _metrics) {
	if (lines > 200 || functionCount > 5) return "high";
	if (lines > 50 || functionCount > 2) return "medium";
	return "low";
}

// Helper to get tags
function getTags(filePath, fileCategory, language) {
	const tags = [language, fileCategory];
	if (filePath.includes("/components/")) tags.push("component");
	if (filePath.includes("/hooks/")) tags.push("hook");
	if (filePath.includes("/lib/")) tags.push("library");
	if (filePath.includes("/utils/")) tags.push("utility");
	if (filePath.includes("test.ts") || filePath.includes("test.tsx"))
		tags.push("test");
	if (filePath.includes("/stores/")) tags.push("state-management");
	if (filePath.includes("Modal")) tags.push("modal");
	if (filePath.includes("trpc")) tags.push("api");
	return tags;
}

// Process each file
for (const file of results) {
	const filePath = file.path;
	const fileId = `file:${filePath}`;

	// Create file node
	nodes.push({
		id: fileId,
		type: "file",
		name: path.basename(filePath),
		filePath: filePath,
		summary: `${file.language} ${file.fileCategory} file with ${file.totalLines} lines, ${file.functions?.length || 0} functions, ${file.classes?.length || 0} classes`,
		tags: getTags(filePath, file.fileCategory, file.language),
		complexity: getComplexity(
			file.totalLines,
			file.functions?.length || 0,
			file.classes?.length || 0,
			file.metrics,
		),
	});

	// Process imports
	const imports = batchImportData[filePath] || [];
	for (const importPath of imports) {
		edges.push({
			from: fileId,
			to: `file:${importPath}`,
			type: "imports",
			weight: 0.7,
		});
	}

	// Process functions
	if (file.functions) {
		for (const func of file.functions) {
			const lineCount = func.endLine - func.startLine + 1;
			const isExported = file.exports?.some((e) => e.name === func.name);

			// Create node if 10+ lines OR exported
			if (lineCount >= 10 || isExported) {
				const funcId = `function:${filePath}:${func.name}`;
				nodes.push({
					id: funcId,
					type: "function",
					name: func.name,
					filePath: filePath,
					summary: `Function with ${lineCount} lines (${func.startLine}-${func.endLine})${isExported ? ", exported" : ""}`,
					tags: [
						file.language,
						isExported ? "exported" : "internal",
						lineCount > 50 ? "complex" : "simple",
					],
					complexity:
						lineCount > 100 ? "high" : lineCount > 30 ? "medium" : "low",
					lineRange: `${func.startLine}-${func.endLine}`,
				});

				// Contains edge
				edges.push({
					from: fileId,
					to: funcId,
					type: "contains",
					weight: 1.0,
				});

				// Exports edge
				if (isExported) {
					edges.push({
						from: fileId,
						to: funcId,
						type: "exports",
						weight: 0.8,
					});
				}
			}
		}
	}

	// Process classes
	if (file.classes) {
		for (const cls of file.classes) {
			const lineCount = cls.endLine - cls.startLine + 1;
			const isExported = file.exports?.some((e) => e.name === cls.name);

			if (lineCount >= 10 || isExported) {
				const classId = `class:${filePath}:${cls.name}`;
				nodes.push({
					id: classId,
					type: "class",
					name: cls.name,
					filePath: filePath,
					summary: `Class with ${lineCount} lines (${cls.startLine}-${cls.endLine})${isExported ? ", exported" : ""}`,
					tags: [file.language, isExported ? "exported" : "internal"],
					complexity:
						lineCount > 100 ? "high" : lineCount > 30 ? "medium" : "low",
					lineRange: `${cls.startLine}-${cls.endLine}`,
				});

				edges.push({
					from: fileId,
					to: classId,
					type: "contains",
					weight: 1.0,
				});

				if (isExported) {
					edges.push({
						from: fileId,
						to: classId,
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
			const callerId = `function:${filePath}:${call.caller}`;
			const calleeName = call.callee.split(".")[0]; // Handle method calls like "array.map"

			// Only create call edge if both are significant functions in this file
			if (file.functions?.some((f) => f.name === call.caller)) {
				const callerFunc = file.functions.find((f) => f.name === call.caller);
				const callerLines = callerFunc.endLine - callerFunc.startLine + 1;
				const callerExported = file.exports?.some(
					(e) => e.name === call.caller,
				);

				if (callerLines >= 10 || callerExported) {
					if (file.functions?.some((f) => f.name === calleeName)) {
						const calleeFunc = file.functions.find(
							(f) => f.name === calleeName,
						);
						const calleeLines = calleeFunc.endLine - calleeFunc.startLine + 1;
						const calleeExported = file.exports?.some(
							(e) => e.name === calleeName,
						);

						if (calleeLines >= 10 || calleeExported) {
							const calleeId = `function:${filePath}:${calleeName}`;
							edges.push({
								from: callerId,
								to: calleeId,
								type: "calls",
								weight: 0.8,
							});
						}
					}
				}
			}
		}
	}
}

// Check for test relationships
for (const file of results) {
	if (file.path.includes(".test.ts") || file.path.includes(".test.tsx")) {
		const testedFile = file.path
			.replace(".test.ts", ".ts")
			.replace(".test.tsx", ".tsx");
		const testFileId = `file:${file.path}`;
		const testedFileId = `file:${testedFile}`;

		if (results.some((f) => f.path === testedFile)) {
			edges.push({
				from: testFileId,
				to: testedFileId,
				type: "tested_by",
				weight: 0.5,
			});
		}
	}
}

console.log(`Total nodes: ${nodes.length}`);
console.log(`Total edges: ${edges.length}`);

// Check if we need to split
if (nodes.length <= 60 && edges.length <= 120) {
	// Single file
	const output = { nodes, edges };
	fs.writeFileSync(
		path.join(__dirname, "batch-23.json"),
		JSON.stringify(output, null, 2),
	);
	console.log("Written to batch-23.json");
} else {
	// Split into parts
	const nodesPerPart = 50;
	const partCount = Math.ceil(nodes.length / nodesPerPart);

	for (let i = 0; i < partCount; i++) {
		const startIdx = i * nodesPerPart;
		const endIdx = Math.min((i + 1) * nodesPerPart, nodes.length);
		const partNodes = nodes.slice(startIdx, endIdx);

		// Include edges that reference nodes in this part
		const nodeIds = new Set(partNodes.map((n) => n.id));
		const partEdges = edges.filter(
			(e) => nodeIds.has(e.from) || nodeIds.has(e.to),
		);

		const output = { nodes: partNodes, edges: partEdges };
		fs.writeFileSync(
			path.join(__dirname, `batch-23-part-${i + 1}.json`),
			JSON.stringify(output, null, 2),
		);
		console.log(
			`Written to batch-23-part-${i + 1}.json (${partNodes.length} nodes, ${partEdges.length} edges)`,
		);
	}
}
