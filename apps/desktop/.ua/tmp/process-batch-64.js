const fs = require("node:fs");
const _path = require("node:path");

// Read input files
const extractResults = JSON.parse(
	fs.readFileSync(
		"/Users/wushengyu/Develop/hustle/superset/apps/desktop/.ua/tmp/ua-file-extract-results-64.json",
		"utf8",
	),
);

const dispatch = JSON.parse(
	fs.readFileSync(
		"/Users/wushengyu/Develop/hustle/superset/apps/desktop/.ua/tmp/dispatch-64.json",
		"utf8",
	),
);

const nodes = [];
const edges = [];

// Process each file
for (const fileData of extractResults.results) {
	const filePath = fileData.path;

	// Create file node
	nodes.push({
		id: `file:${filePath}`,
		type: "file",
		properties: {
			path: filePath,
			language: fileData.language,
			category: fileData.fileCategory,
			totalLines: fileData.totalLines,
			nonEmptyLines: fileData.nonEmptyLines,
			functionCount: fileData.metrics?.functionCount || 0,
			classCount: fileData.metrics?.classCount || 0,
			importCount: fileData.metrics?.importCount || 0,
			exportCount: fileData.metrics?.exportCount || 0,
		},
	});

	// Create function nodes and contains edges
	if (fileData.functions) {
		for (const func of fileData.functions) {
			const funcId = `function:${filePath}:${func.name}`;
			nodes.push({
				id: funcId,
				type: "function",
				properties: {
					name: func.name,
					startLine: func.startLine,
					endLine: func.endLine,
					params: func.params,
				},
			});

			// File contains function
			edges.push({
				source: `file:${filePath}`,
				target: funcId,
				type: "contains",
				weight: 1.0,
			});
		}
	}

	// Create class nodes and contains edges
	if (fileData.classes) {
		for (const cls of fileData.classes) {
			const clsId = `class:${filePath}:${cls.name}`;
			nodes.push({
				id: clsId,
				type: "class",
				properties: {
					name: cls.name,
					startLine: cls.startLine,
					endLine: cls.endLine,
				},
			});

			// File contains class
			edges.push({
				source: `file:${filePath}`,
				target: clsId,
				type: "contains",
				weight: 1.0,
			});
		}
	}

	// Create export edges
	if (fileData.exports) {
		for (const exp of fileData.exports) {
			const sourceId = exp.isDefault
				? `file:${filePath}`
				: fileData.functions?.some((f) => f.name === exp.name)
					? `function:${filePath}:${exp.name}`
					: fileData.classes?.some((c) => c.name === exp.name)
						? `class:${filePath}:${exp.name}`
						: `file:${filePath}`;

			edges.push({
				source: sourceId,
				target: `file:${filePath}`,
				type: "exports",
				weight: 0.8,
				properties: {
					name: exp.name,
					isDefault: exp.isDefault,
					line: exp.line,
				},
			});
		}
	}

	// Create call edges
	if (fileData.callGraph) {
		for (const call of fileData.callGraph) {
			const callerId = `function:${filePath}:${call.caller}`;

			// Only create edge if caller function exists as a node
			if (fileData.functions?.some((f) => f.name === call.caller)) {
				edges.push({
					source: callerId,
					target: call.callee,
					type: "calls",
					weight: 0.8,
					properties: {
						lineNumber: call.lineNumber,
					},
				});
			}
		}
	}
}

// Create import edges from batchImportData
const importData = dispatch.batchImportData || {};
for (const [sourcePath, imports] of Object.entries(importData)) {
	for (const targetPath of imports) {
		edges.push({
			source: `file:${sourcePath}`,
			target: `file:${targetPath}`,
			type: "imports",
			weight: 0.7,
		});
	}
}

// Check for test relationships
for (const fileData of extractResults.results) {
	const filePath = fileData.path;
	if (filePath.includes(".test.") || filePath.includes(".spec.")) {
		// This is a test file - find what it tests
		const testedPath = filePath
			.replace(/\.(test|spec)\.tsx?$/, ".tsx")
			.replace(/\.(test|spec)\.tsx?$/, ".ts");
		const testedFileExists = extractResults.results.some(
			(f) => f.path === testedPath,
		);

		if (testedFileExists) {
			edges.push({
				source: `file:${filePath}`,
				target: `file:${testedPath}`,
				type: "tested_by",
				weight: 0.5,
			});
		}
	}
}

const output = {
	batchIndex: dispatch.batchIndex,
	totalBatches: dispatch.totalBatches,
	nodes,
	edges,
	stats: {
		fileCount: extractResults.filesAnalyzed,
		nodeCount: nodes.length,
		edgeCount: edges.length,
		functionCount: nodes.filter((n) => n.type === "function").length,
		classCount: nodes.filter((n) => n.type === "class").length,
		importEdgeCount: edges.filter((e) => e.type === "imports").length,
		containsEdgeCount: edges.filter((e) => e.type === "contains").length,
		exportsEdgeCount: edges.filter((e) => e.type === "exports").length,
		callsEdgeCount: edges.filter((e) => e.type === "calls").length,
		testedByEdgeCount: edges.filter((e) => e.type === "tested_by").length,
	},
};

fs.writeFileSync(
	"/Users/wushengyu/Develop/hustle/superset/apps/desktop/.ua/tmp/batch-64.json",
	JSON.stringify(output, null, 2),
);

console.log(JSON.stringify(output.stats, null, 2));
