const fs = require("node:fs");

const dispatch = JSON.parse(fs.readFileSync("dispatch-20.json", "utf8"));
const extractResults = JSON.parse(
	fs.readFileSync("ua-file-extract-results-20.json", "utf8"),
);

const nodes = [];
const edges = [];
const nodeIds = new Set();

// Helper to create unique IDs
function fileId(path) {
	return `file:${path}`;
}

function functionId(path, name) {
	return `function:${path}:${name}`;
}

function _classId(path, name) {
	return `class:${path}:${name}`;
}

// Helper to determine complexity
function calculateComplexity(lines, callCount) {
	if (lines > 200) return "high";
	if (lines > 50 || callCount > 20) return "medium";
	return "low";
}

// Process each file
for (const fileResult of extractResults.results) {
	const filePath = fileResult.path;
	const fileCategory = fileResult.fileCategory;

	// Determine file type
	let fileType = "file";
	if (fileCategory === "config") fileType = "config";
	if (fileCategory === "docs") fileType = "document";

	// Create file node
	const fileNodeId = fileId(filePath);
	const isIndexFile = filePath.endsWith("index.ts");
	const isTypeFile =
		filePath.endsWith("types.ts") || filePath.endsWith("constants.ts");

	let fileSummary = "";
	if (isIndexFile) {
		fileSummary = `Barrel export file re-exporting ${fileResult.metrics?.exportCount || 0} items`;
	} else if (isTypeFile) {
		fileSummary = `Type definitions and constants`;
	} else if (filePath.includes("WorkspaceSidebar.tsx")) {
		fileSummary =
			"Workspace sidebar component managing tabs and file navigation";
	} else if (filePath.includes("FilesTab.tsx")) {
		fileSummary = "File explorer tab with tree view, drag-drop, and git status";
	} else if (filePath.includes("useFilesTabActions")) {
		fileSummary = "Hook managing file/folder CRUD operations in files tab";
	} else if (filePath.includes("useFilesTabBridge")) {
		fileSummary =
			"Bridge between file tree model and filesystem, handles loading/syncing";
	} else if (filePath.includes("useFilesTabDrop")) {
		fileSummary = "Drag-and-drop handler for uploading files to workspace";
	} else if (filePath.includes("FileMention")) {
		fileSummary = "File mention support for markdown editor";
	} else if (filePath.includes("clickPolicy")) {
		fileSummary = "Click policy utilities for modifier key handling";
	} else {
		fileSummary = `${fileType === "file" ? "TypeScript" : fileType} file with ${fileResult.metrics?.functionCount || 0} functions`;
	}

	const fileTags = [];
	if (filePath.includes("/components/")) fileTags.push("component");
	if (filePath.includes("/hooks/")) fileTags.push("hook");
	if (filePath.includes("/utils/")) fileTags.push("utility");
	if (filePath.includes("FilesTab")) fileTags.push("files-tab");
	if (filePath.includes("WorkspaceSidebar")) fileTags.push("sidebar");
	if (filePath.includes("MarkdownEditor")) fileTags.push("markdown");
	if (isIndexFile) fileTags.push("barrel-export");
	if (isTypeFile) fileTags.push("types");

	nodes.push({
		id: fileNodeId,
		type: fileType,
		name: filePath.split("/").pop(),
		filePath: filePath,
		summary: fileSummary,
		tags: fileTags,
		complexity: calculateComplexity(
			fileResult.totalLines,
			fileResult.callGraph?.length || 0,
		),
	});
	nodeIds.add(fileNodeId);

	// Process functions (10+ lines OR exported)
	if (fileResult.functions) {
		for (const func of fileResult.functions) {
			const lineCount = func.endLine - func.startLine + 1;
			const isExported = fileResult.exports?.some((e) => e.name === func.name);

			if (lineCount >= 10 || isExported) {
				const funcNodeId = functionId(filePath, func.name);
				const callCount =
					fileResult.callGraph?.filter((c) => c.caller === func.name).length ||
					0;

				let funcSummary = "";
				if (func.name.startsWith("use")) {
					funcSummary = `React hook (${lineCount} lines)`;
				} else if (func.name.endsWith("Tab") || func.name.includes("Sidebar")) {
					funcSummary = `Component function (${lineCount} lines)`;
				} else {
					funcSummary = `Function with ${lineCount} lines`;
				}

				nodes.push({
					id: funcNodeId,
					type: "function",
					name: func.name,
					filePath: filePath,
					summary: funcSummary,
					tags: isExported ? ["exported"] : [],
					complexity: calculateComplexity(lineCount, callCount),
					lineRange: { start: func.startLine, end: func.endLine },
				});
				nodeIds.add(funcNodeId);

				// Create contains edge
				edges.push({
					source: fileNodeId,
					target: funcNodeId,
					type: "contains",
					weight: 1.0,
				});

				// Create export edge if exported
				if (isExported) {
					edges.push({
						source: fileNodeId,
						target: funcNodeId,
						type: "exports",
						weight: 0.8,
					});
				}
			}
		}
	}
}

// Process import edges from batchImportData
for (const [sourcePath, targetPaths] of Object.entries(
	dispatch.batchImportData,
)) {
	const sourceId = fileId(sourcePath);
	for (const targetPath of targetPaths) {
		const targetId = fileId(targetPath);
		edges.push({
			source: sourceId,
			target: targetId,
			type: "imports",
			weight: 0.7,
		});
	}
}

// Process call edges (limited to avoid explosion)
for (const fileResult of extractResults.results) {
	const filePath = fileResult.path;

	if (fileResult.callGraph && fileResult.callGraph.length > 0) {
		// Group calls by caller
		const callsByCaller = {};
		for (const call of fileResult.callGraph) {
			if (!callsByCaller[call.caller]) {
				callsByCaller[call.caller] = [];
			}
			callsByCaller[call.caller].push(call.callee);
		}

		// Create call edges for significant functions only
		for (const [caller, callees] of Object.entries(callsByCaller)) {
			const callerFuncId = functionId(filePath, caller);
			if (nodeIds.has(callerFuncId)) {
				// Limit to first 5 calls per function to avoid edge explosion
				const limitedCallees = [...new Set(callees)].slice(0, 5);
				for (const callee of limitedCallees) {
					const calleeFuncId = functionId(filePath, callee);
					if (nodeIds.has(calleeFuncId)) {
						edges.push({
							source: callerFuncId,
							target: calleeFuncId,
							type: "calls",
							weight: 0.8,
						});
					}
				}
			}
		}
	}
}

console.log(`Generated ${nodes.length} nodes and ${edges.length} edges`);

// Check if we need to split
if (nodes.length <= 60 && edges.length <= 120) {
	// Single file
	fs.writeFileSync("batch-20.json", JSON.stringify({ nodes, edges }, null, 2));
	console.log("Output: batch-20.json");
} else {
	// Split into parts
	const nodesPerPart = 40;
	const edgesPerPart = 80;

	let partIndex = 1;
	let nodeOffset = 0;

	while (nodeOffset < nodes.length) {
		const partNodes = nodes.slice(nodeOffset, nodeOffset + nodesPerPart);
		const partNodeIds = new Set(partNodes.map((n) => n.id));

		// Include edges where both source and target are in this part
		const partEdges = edges
			.filter((e) => partNodeIds.has(e.source) && partNodeIds.has(e.target))
			.slice(0, edgesPerPart);

		fs.writeFileSync(
			`batch-20-part-${partIndex}.json`,
			JSON.stringify({ nodes: partNodes, edges: partEdges }, null, 2),
		);

		console.log(
			`Output: batch-20-part-${partIndex}.json (${partNodes.length} nodes, ${partEdges.length} edges)`,
		);

		nodeOffset += nodesPerPart;
		partIndex++;
	}
}
