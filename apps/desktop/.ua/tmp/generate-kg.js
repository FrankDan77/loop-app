const fs = require("node:fs");
const path = require("node:path");

// Read input files
const extractResults = JSON.parse(
	fs.readFileSync(
		path.join(__dirname, "ua-file-extract-results-16.json"),
		"utf-8",
	),
);
const dispatch = JSON.parse(
	fs.readFileSync(path.join(__dirname, "dispatch-16.json"), "utf-8"),
);

const nodes = [];
const edges = [];

// Helper to determine file type
function getFileType(filePath) {
	if (filePath.includes(".test.") || filePath.includes(".spec.")) return "test";
	if (filePath.match(/\.(json|yaml|yml|toml|config\.)$/)) return "config";
	if (filePath.match(/\.(md|txt)$/)) return "document";
	return "file";
}

// Helper to determine complexity
function getComplexity(lines) {
	if (lines < 50) return "low";
	if (lines < 200) return "medium";
	return "high";
}

// Helper to extract tags
function getTags(fileData) {
	const tags = [];
	if (fileData.path.includes("/components/")) tags.push("component");
	if (fileData.path.includes("/hooks/")) tags.push("hook");
	if (fileData.path.includes("/utils/")) tags.push("util");
	if (fileData.path.includes("/stores/")) tags.push("store");
	if (fileData.path.includes("test.")) tags.push("test");
	if (fileData.path.includes("index.")) tags.push("barrel");
	if (fileData.exports?.some((e) => e.name.match(/^use[A-Z]/)))
		tags.push("hook");
	if (fileData.exports?.some((e) => e.name.match(/Context$/)))
		tags.push("context");
	return tags;
}

// Create file nodes
for (const fileData of extractResults.results) {
	const fileType = getFileType(fileData.path);
	const tags = getTags(fileData);

	nodes.push({
		id: `file:${fileData.path}`,
		type: fileType === "test" ? "file" : fileType,
		name: fileData.path.split("/").pop(),
		filePath: fileData.path,
		summary: `${fileData.language} ${fileData.fileCategory} file with ${fileData.metrics.exportCount} exports, ${fileData.metrics.functionCount} functions`,
		tags,
		complexity: getComplexity(fileData.totalLines),
	});

	// Create function/class nodes for significant symbols (10+ lines OR exported)
	if (fileData.functions) {
		for (const func of fileData.functions) {
			const lineCount = func.endLine - func.startLine + 1;
			const isExported = fileData.exports?.some((e) => e.name === func.name);

			if (lineCount >= 10 || isExported) {
				nodes.push({
					id: `function:${fileData.path}:${func.name}`,
					type: "function",
					name: func.name,
					filePath: fileData.path,
					lineRange: [func.startLine, func.endLine],
					summary: `Function with ${func.params?.length || 0} parameters (${lineCount} lines)`,
					tags: isExported ? ["exported"] : [],
					complexity: getComplexity(lineCount),
				});

				// Contains edge
				edges.push({
					source: `file:${fileData.path}`,
					target: `function:${fileData.path}:${func.name}`,
					type: "contains",
					weight: 1.0,
				});

				// Export edge
				if (isExported) {
					edges.push({
						source: `file:${fileData.path}`,
						target: `function:${fileData.path}:${func.name}`,
						type: "exports",
						weight: 0.8,
					});
				}
			}
		}
	}

	if (fileData.classes) {
		for (const cls of fileData.classes) {
			const lineCount = cls.endLine - cls.startLine + 1;
			const isExported = fileData.exports?.some((e) => e.name === cls.name);

			if (lineCount >= 10 || isExported) {
				nodes.push({
					id: `class:${fileData.path}:${cls.name}`,
					type: "class",
					name: cls.name,
					filePath: fileData.path,
					lineRange: [cls.startLine, cls.endLine],
					summary: `Class (${lineCount} lines)`,
					tags: isExported ? ["exported"] : [],
					complexity: getComplexity(lineCount),
				});

				edges.push({
					source: `file:${fileData.path}`,
					target: `class:${fileData.path}:${cls.name}`,
					type: "contains",
					weight: 1.0,
				});

				if (isExported) {
					edges.push({
						source: `file:${fileData.path}`,
						target: `class:${fileData.path}:${cls.name}`,
						type: "exports",
						weight: 0.8,
					});
				}
			}
		}
	}
}

// Create import edges
for (const [filePath, imports] of Object.entries(dispatch.batchImportData)) {
	for (const importPath of imports) {
		edges.push({
			source: `file:${filePath}`,
			target: `file:${importPath}`,
			type: "imports",
			weight: 0.7,
		});
	}
}

// Create call edges from callGraph
for (const fileData of extractResults.results) {
	if (fileData.callGraph) {
		for (const call of fileData.callGraph) {
			const callerNodeId = `function:${fileData.path}:${call.caller}`;

			// Only create edge if caller node exists
			if (nodes.some((n) => n.id === callerNodeId)) {
				// For internal calls within the file
				const calleeNodeId = `function:${fileData.path}:${call.callee}`;
				if (nodes.some((n) => n.id === calleeNodeId)) {
					edges.push({
						source: callerNodeId,
						target: calleeNodeId,
						type: "calls",
						weight: 0.8,
					});
				}
			}
		}
	}
}

// Create tested_by edge
const testFile =
	"src/renderer/screens/main/components/WorkspaceView/ContentView/TabsContent/Terminal/pane-guards.test.ts";
const testedFile =
	"src/renderer/screens/main/components/WorkspaceView/ContentView/TabsContent/Terminal/pane-guards.ts";
if (
	nodes.some((n) => n.id === `file:${testFile}`) &&
	nodes.some((n) => n.id === `file:${testedFile}`)
) {
	edges.push({
		source: `file:${testedFile}`,
		target: `file:${testFile}`,
		type: "tested_by",
		weight: 0.5,
	});
}

// Create depends_on edges from neighborMap
for (const [filePath, neighbors] of Object.entries(dispatch.neighborMap)) {
	for (const neighbor of neighbors) {
		// Skip if already covered by imports
		const hasImport = edges.some(
			(e) =>
				e.source === `file:${filePath}` &&
				e.target === `file:${neighbor.path}` &&
				e.type === "imports",
		);

		if (!hasImport && nodes.some((n) => n.id === `file:${neighbor.path}`)) {
			edges.push({
				source: `file:${filePath}`,
				target: `file:${neighbor.path}`,
				type: "depends_on",
				weight: 0.6,
			});
		}
	}
}

console.log(`Generated ${nodes.length} nodes and ${edges.length} edges`);

// Determine if we need to split
const shouldSplit = nodes.length > 60 || edges.length > 120;

if (shouldSplit) {
	console.log("Splitting into multiple files...");

	// Split nodes and edges into chunks
	const nodesPerFile = 50;
	const edgesPerFile = 100;

	const numNodeFiles = Math.ceil(nodes.length / nodesPerFile);
	const numEdgeFiles = Math.ceil(edges.length / edgesPerFile);
	const numFiles = Math.max(numNodeFiles, numEdgeFiles);

	for (let i = 0; i < numFiles; i++) {
		const startNodeIdx = i * nodesPerFile;
		const endNodeIdx = Math.min(startNodeIdx + nodesPerFile, nodes.length);
		const startEdgeIdx = i * edgesPerFile;
		const endEdgeIdx = Math.min(startEdgeIdx + edgesPerFile, edges.length);

		const chunk = {
			nodes: nodes.slice(startNodeIdx, endNodeIdx),
			edges: edges.slice(startEdgeIdx, endEdgeIdx),
		};

		const filename = `batch-16-part-${i + 1}.json`;
		fs.writeFileSync(
			path.join(__dirname, filename),
			JSON.stringify(chunk, null, 2),
		);
		console.log(
			`Wrote ${filename}: ${chunk.nodes.length} nodes, ${chunk.edges.length} edges`,
		);
	}
} else {
	const output = { nodes, edges };
	fs.writeFileSync(
		path.join(__dirname, "batch-16.json"),
		JSON.stringify(output, null, 2),
	);
	console.log("Wrote batch-16.json");
}
