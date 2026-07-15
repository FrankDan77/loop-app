const dispatch = require("./dispatch-8.json");
const extraction = require("./ua-file-extract-results-8.json");

const nodes = [];
const edges = [];

// Helper to determine complexity
function getComplexity(nonEmptyLines) {
	if (nonEmptyLines < 30) return "simple";
	if (nonEmptyLines < 100) return "moderate";
	return "complex";
}

// Helper to generate tags
function generateTags(filePath, language, fileCategory) {
	const tags = [language, fileCategory];
	if (filePath.includes("terminal")) tags.push("terminal");
	if (filePath.includes("daemon")) tags.push("daemon");
	if (filePath.includes("pty")) tags.push("pty");
	if (filePath.includes("history")) tags.push("history");
	if (filePath.includes("host")) tags.push("host");
	if (filePath.includes("tray")) tags.push("tray");
	if (filePath.includes("sentry")) tags.push("sentry");
	if (filePath.includes(".test.")) tags.push("test");
	return [...new Set(tags)].slice(0, 5);
}

// Process each file
for (const result of extraction.results) {
	const filePath = result.path;

	// Create file node
	const fileNode = {
		id: `file:${filePath}`,
		type: "file",
		name: filePath.split("/").pop(),
		filePath: filePath,
		summary: `${result.language} file with ${result.metrics.functionCount} functions and ${result.metrics.classCount} classes`,
		tags: generateTags(filePath, result.language, result.fileCategory),
		complexity: getComplexity(result.nonEmptyLines),
	};

	nodes.push(fileNode);

	// Create function nodes (10+ lines OR exported)
	if (result.functions) {
		for (const func of result.functions) {
			const lines = func.endLine - func.startLine + 1;
			const isExported = result.exports?.some((e) => e.name === func.name);

			if (lines >= 10 || isExported) {
				const funcNode = {
					id: `function:${filePath}:${func.name}`,
					type: "function",
					name: func.name,
					filePath: filePath,
					lineRange: [func.startLine, func.endLine],
					summary: `Function with ${func.params.length} parameters, ${lines} lines`,
					tags: generateTags(filePath, result.language, "function")
						.slice(0, 4)
						.concat(["function"]),
					complexity: getComplexity(lines),
				};

				nodes.push(funcNode);

				// Contains edge
				edges.push({
					from: `file:${filePath}`,
					to: `function:${filePath}:${func.name}`,
					type: "contains",
					strength: 1.0,
					direction: "forward",
				});

				// Exports edge if exported
				if (isExported) {
					edges.push({
						from: `file:${filePath}`,
						to: `function:${filePath}:${func.name}`,
						type: "exports",
						strength: 0.8,
						direction: "forward",
					});
				}
			}
		}
	}

	// Create class nodes (2+ methods or 20+ lines OR exported)
	if (result.classes) {
		for (const cls of result.classes) {
			const lines = cls.endLine - cls.startLine + 1;
			const isExported = result.exports?.some((e) => e.name === cls.name);

			if (cls.methods.length >= 2 || lines >= 20 || isExported) {
				const classNode = {
					id: `class:${filePath}:${cls.name}`,
					type: "class",
					name: cls.name,
					filePath: filePath,
					lineRange: [cls.startLine, cls.endLine],
					summary: `Class with ${cls.methods.length} methods, ${lines} lines`,
					tags: generateTags(filePath, result.language, "class")
						.slice(0, 4)
						.concat(["class"]),
					complexity: getComplexity(lines),
				};

				nodes.push(classNode);

				// Contains edge
				edges.push({
					from: `file:${filePath}`,
					to: `class:${filePath}:${cls.name}`,
					type: "contains",
					strength: 1.0,
					direction: "forward",
				});

				// Exports edge if exported
				if (isExported) {
					edges.push({
						from: `file:${filePath}`,
						to: `class:${filePath}:${cls.name}`,
						type: "exports",
						strength: 0.8,
						direction: "forward",
					});
				}
			}
		}
	}

	// Import edges
	const imports = dispatch.batchImportData[filePath] || [];
	for (const importPath of imports) {
		edges.push({
			from: `file:${filePath}`,
			to: `file:${importPath}`,
			type: "imports",
			strength: 0.7,
			direction: "forward",
		});
	}
}

// Add test file edges
for (const result of extraction.results) {
	if (result.path.includes(".test.")) {
		const productionPath = result.path.replace(".test.", ".");
		const prodFile = extraction.results.find((r) => r.path === productionPath);
		if (prodFile) {
			edges.push({
				from: `file:${productionPath}`,
				to: `file:${result.path}`,
				type: "tested_by",
				strength: 0.5,
				direction: "forward",
			});
		}
	}
}

// Check if we need to split
const needsSplit = nodes.length > 60 || edges.length > 120;

const fs = require("node:fs");
const path = require("node:path");

// Ensure intermediate directory exists
const intermediatePath = path.resolve(__dirname, "../intermediate");
if (!fs.existsSync(intermediatePath)) {
	fs.mkdirSync(intermediatePath, { recursive: true });
}

if (!needsSplit) {
	// Write single file
	const output = { nodes, edges };
	fs.writeFileSync(
		path.join(intermediatePath, "batch-8.json"),
		JSON.stringify(output, null, 2),
	);
	console.log(`Single file: ${nodes.length} nodes, ${edges.length} edges`);
} else {
	// Need to split
	const parts = Math.ceil(Math.max(nodes.length / 60, edges.length / 120));
	console.log(
		`Splitting into ${parts} parts: ${nodes.length} nodes, ${edges.length} edges`,
	);

	// Sort files alphabetically
	const sortedResults = [...extraction.results].sort((a, b) =>
		a.path.localeCompare(b.path),
	);
	const filesPerPart = Math.ceil(sortedResults.length / parts);

	for (let partIdx = 0; partIdx < parts; partIdx++) {
		const partNodes = [];
		const partEdges = [];
		const startIdx = partIdx * filesPerPart;
		const endIdx = Math.min((partIdx + 1) * filesPerPart, sortedResults.length);
		const partFiles = sortedResults.slice(startIdx, endIdx).map((r) => r.path);
		const partFileSet = new Set(partFiles);

		// Add nodes for this part
		for (const node of nodes) {
			if (partFileSet.has(node.filePath)) {
				partNodes.push(node);
			}
		}

		// Add edges for this part (only if from-node is in this part)
		for (const edge of edges) {
			const fromFile = edge.from.split(":")[1];
			if (partFileSet.has(fromFile)) {
				partEdges.push(edge);
			}
		}

		const output = { nodes: partNodes, edges: partEdges };
		fs.writeFileSync(
			path.join(intermediatePath, `batch-8-part-${partIdx + 1}.json`),
			JSON.stringify(output, null, 2),
		);
		console.log(
			`Part ${partIdx + 1}: ${partNodes.length} nodes, ${partEdges.length} edges`,
		);
	}
}
