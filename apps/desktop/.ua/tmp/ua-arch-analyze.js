#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

// Parse command line arguments
const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
	console.error("Usage: node ua-arch-analyze.js <input.json> <output.json>");
	process.exit(1);
}

try {
	// Read input
	const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
	const { fileNodes, importEdges, allEdges } = input;

	// A. Directory Grouping
	const directoryGroups = {};

	// Find common prefix
	const allPaths = fileNodes
		.map((n) => n.filePath || n.path || "")
		.filter((p) => p);
	let commonPrefix = "";

	if (allPaths.length > 0) {
		const sorted = allPaths.slice().sort();
		const first = sorted[0];
		const last = sorted[sorted.length - 1];

		for (let i = 0; i < first.length; i++) {
			if (first[i] === last[i]) {
				commonPrefix += first[i];
			} else {
				break;
			}
		}

		// Trim to last directory separator
		const lastSlash = commonPrefix.lastIndexOf("/");
		if (lastSlash > 0) {
			commonPrefix = commonPrefix.substring(0, lastSlash + 1);
		} else {
			commonPrefix = "";
		}
	}

	// Group by first directory after common prefix
	for (const node of fileNodes) {
		const filePath = node.filePath || node.path || "";
		if (!filePath) continue;

		let relativePath = filePath;
		if (commonPrefix && filePath.startsWith(commonPrefix)) {
			relativePath = filePath.substring(commonPrefix.length);
		}

		let groupName;
		const firstSlash = relativePath.indexOf("/");
		if (firstSlash > 0) {
			groupName = relativePath.substring(0, firstSlash);
		} else {
			groupName = "_root";
		}

		if (!directoryGroups[groupName]) {
			directoryGroups[groupName] = [];
		}
		directoryGroups[groupName].push(node.id);
	}

	// B. Node Type Grouping
	const nodeTypeGroups = {};
	for (const node of fileNodes) {
		const type = node.type || "unknown";
		if (!nodeTypeGroups[type]) {
			nodeTypeGroups[type] = [];
		}
		nodeTypeGroups[type].push(node.id);
	}

	// C. Import Adjacency Matrix
	const fileFanIn = {};
	const fileFanOut = {};

	for (const edge of importEdges) {
		fileFanOut[edge.source] = (fileFanOut[edge.source] || 0) + 1;
		fileFanIn[edge.target] = (fileFanIn[edge.target] || 0) + 1;
	}

	// D. Cross-Category Dependency Analysis
	const crossCategoryEdges = [];
	const edgeTypeMatrix = {};

	for (const edge of allEdges) {
		const sourceNode = fileNodes.find((n) => n.id === edge.source);
		const targetNode = fileNodes.find((n) => n.id === edge.target);

		if (sourceNode && targetNode) {
			const key = `${sourceNode.type}->${targetNode.type}:${edge.type}`;
			edgeTypeMatrix[key] = (edgeTypeMatrix[key] || 0) + 1;
		}
	}

	for (const [key, count] of Object.entries(edgeTypeMatrix)) {
		const [types, edgeType] = key.split(":");
		const [fromType, toType] = types.split("->");
		crossCategoryEdges.push({ fromType, toType, edgeType, count });
	}

	// E. Inter-Group Import Frequency
	const nodeToGroup = {};
	for (const [group, nodeIds] of Object.entries(directoryGroups)) {
		for (const nodeId of nodeIds) {
			nodeToGroup[nodeId] = group;
		}
	}

	const interGroupImports = [];
	const groupPairCounts = {};

	for (const edge of importEdges) {
		const sourceGroup = nodeToGroup[edge.source];
		const targetGroup = nodeToGroup[edge.target];

		if (sourceGroup && targetGroup && sourceGroup !== targetGroup) {
			const key = `${sourceGroup}->${targetGroup}`;
			groupPairCounts[key] = (groupPairCounts[key] || 0) + 1;
		}
	}

	for (const [key, count] of Object.entries(groupPairCounts)) {
		const [from, to] = key.split("->");
		interGroupImports.push({ from, to, count });
	}

	// F. Intra-Group Import Density
	const intraGroupDensity = {};

	for (const [group, nodeIds] of Object.entries(directoryGroups)) {
		const groupNodeSet = new Set(nodeIds);
		let internalEdges = 0;
		let totalEdges = 0;

		for (const edge of importEdges) {
			if (groupNodeSet.has(edge.source) || groupNodeSet.has(edge.target)) {
				totalEdges++;
				if (groupNodeSet.has(edge.source) && groupNodeSet.has(edge.target)) {
					internalEdges++;
				}
			}
		}

		intraGroupDensity[group] = {
			internalEdges,
			totalEdges,
			density: totalEdges > 0 ? internalEdges / totalEdges : 0,
		};
	}

	// G. Directory Pattern Matching
	const patternMap = {
		routes: "api",
		api: "api",
		controllers: "api",
		endpoints: "api",
		handlers: "api",
		routers: "api",
		serializers: "api",
		blueprints: "api",
		controller: "api",
		services: "service",
		core: "service",
		lib: "service",
		domain: "service",
		logic: "service",
		internal: "service",
		composables: "service",
		signals: "service",
		mailers: "service",
		jobs: "service",
		channels: "service",
		models: "data",
		db: "data",
		data: "data",
		persistence: "data",
		repository: "data",
		entities: "data",
		migrations: "data",
		entity: "data",
		sql: "data",
		database: "data",
		schema: "data",
		components: "ui",
		views: "ui",
		pages: "ui",
		ui: "ui",
		layouts: "ui",
		screens: "ui",
		middleware: "middleware",
		plugins: "middleware",
		interceptors: "middleware",
		guards: "middleware",
		utils: "utility",
		helpers: "utility",
		common: "utility",
		shared: "utility",
		tools: "utility",
		pkg: "utility",
		templatetags: "utility",
		config: "config",
		constants: "config",
		env: "config",
		settings: "config",
		management: "config",
		commands: "config",
		wsgi: "config",
		asgi: "config",
		__tests__: "test",
		test: "test",
		tests: "test",
		spec: "test",
		specs: "test",
		types: "types",
		interfaces: "types",
		schemas: "types",
		contracts: "types",
		dtos: "types",
		dto: "types",
		request: "types",
		response: "types",
		hooks: "hooks",
		store: "state",
		state: "state",
		reducers: "state",
		actions: "state",
		slices: "state",
		assets: "assets",
		static: "assets",
		public: "assets",
		cmd: "entry",
		bin: "entry",
		docs: "documentation",
		documentation: "documentation",
		wiki: "documentation",
		deploy: "infrastructure",
		deployment: "infrastructure",
		infra: "infrastructure",
		infrastructure: "infrastructure",
		k8s: "infrastructure",
		kubernetes: "infrastructure",
		helm: "infrastructure",
		charts: "infrastructure",
		terraform: "infrastructure",
		tf: "infrastructure",
		docker: "infrastructure",
		".github": "ci-cd",
		".gitlab": "ci-cd",
		".circleci": "ci-cd",
	};

	const patternMatches = {};
	for (const [group, _nodeIds] of Object.entries(directoryGroups)) {
		const normalizedGroup = group.toLowerCase();
		if (patternMap[normalizedGroup]) {
			patternMatches[group] = patternMap[normalizedGroup];
		}
	}

	// Check file-level patterns
	for (const node of fileNodes) {
		const filePath = node.filePath || node.path || "";
		const fileName = path.basename(filePath);
		const group = nodeToGroup[node.id];

		// Test files
		if (
			/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(fileName) ||
			/^test_/.test(fileName) ||
			/_test\.(go|php|rb|cs)$/.test(fileName)
		) {
			if (group && !patternMatches[group]) {
				patternMatches[group] = "test";
			}
		}

		// Type declaration files
		if (fileName.endsWith(".d.ts")) {
			if (group && !patternMatches[group]) {
				patternMatches[group] = "types";
			}
		}

		// Entry points
		if (
			[
				"index.ts",
				"index.js",
				"__init__.py",
				"main.go",
				"main.rs",
				"manage.py",
			].includes(fileName)
		) {
			if (group && !patternMatches[group]) {
				patternMatches[group] = "entry";
			}
		}

		// Infrastructure
		if (
			/^Dockerfile/.test(fileName) ||
			/docker-compose/.test(fileName) ||
			fileName.endsWith(".tf")
		) {
			if (group && !patternMatches[group]) {
				patternMatches[group] = "infrastructure";
			}
		}

		// Documentation
		if (fileName.endsWith(".md") || fileName.endsWith(".rst")) {
			if (group && !patternMatches[group]) {
				patternMatches[group] = "documentation";
			}
		}
	}

	// H. Deployment Topology Detection
	const deploymentTopology = {
		hasDockerfile: false,
		hasCompose: false,
		hasK8s: false,
		hasTerraform: false,
		hasCI: false,
		infraFiles: [],
	};

	for (const node of fileNodes) {
		const filePath = node.filePath || node.path || "";
		const fileName = path.basename(filePath);

		if (/^Dockerfile/.test(fileName)) {
			deploymentTopology.hasDockerfile = true;
			deploymentTopology.infraFiles.push(filePath);
		}
		if (/docker-compose/.test(fileName)) {
			deploymentTopology.hasCompose = true;
			deploymentTopology.infraFiles.push(filePath);
		}
		if (filePath.includes("k8s") || filePath.includes("kubernetes")) {
			deploymentTopology.hasK8s = true;
			deploymentTopology.infraFiles.push(filePath);
		}
		if (fileName.endsWith(".tf") || fileName.endsWith(".tfvars")) {
			deploymentTopology.hasTerraform = true;
			deploymentTopology.infraFiles.push(filePath);
		}
		if (
			filePath.includes(".github/workflows") ||
			filePath.includes(".gitlab-ci") ||
			fileName === "Jenkinsfile"
		) {
			deploymentTopology.hasCI = true;
			deploymentTopology.infraFiles.push(filePath);
		}
	}

	// I. Data Pipeline Detection
	const dataPipeline = {
		schemaFiles: [],
		migrationFiles: [],
		dataModelFiles: [],
		apiHandlerFiles: [],
	};

	for (const node of fileNodes) {
		const filePath = node.filePath || node.path || "";
		const tags = node.tags || [];

		if (
			filePath.endsWith(".sql") ||
			filePath.endsWith(".graphql") ||
			filePath.endsWith(".proto")
		) {
			dataPipeline.schemaFiles.push(filePath);
		}
		if (filePath.includes("migration")) {
			dataPipeline.migrationFiles.push(filePath);
		}
		if (filePath.includes("models") || tags.includes("data-model")) {
			dataPipeline.dataModelFiles.push(filePath);
		}
		if (tags.includes("api-handler") || tags.includes("route-handler")) {
			dataPipeline.apiHandlerFiles.push(filePath);
		}
	}

	// J. Documentation Coverage
	const docCoverage = {
		groupsWithDocs: 0,
		totalGroups: Object.keys(directoryGroups).length,
		coverageRatio: 0,
		undocumentedGroups: [],
	};

	const groupsWithDocs = new Set();
	for (const node of fileNodes) {
		const filePath = node.filePath || node.path || "";
		const fileName = path.basename(filePath);

		if (fileName.endsWith(".md") || fileName.endsWith(".rst")) {
			const group = nodeToGroup[node.id];
			if (group) {
				groupsWithDocs.add(group);
			}
		}
	}

	docCoverage.groupsWithDocs = groupsWithDocs.size;
	docCoverage.coverageRatio =
		docCoverage.totalGroups > 0
			? groupsWithDocs.size / docCoverage.totalGroups
			: 0;

	for (const group of Object.keys(directoryGroups)) {
		if (!groupsWithDocs.has(group)) {
			docCoverage.undocumentedGroups.push(group);
		}
	}

	// K. Dependency Direction
	const dependencyDirection = [];
	const groupDeps = {};

	for (const { from, to, count } of interGroupImports) {
		const key = `${from}|${to}`;
		const reverseKey = `${to}|${from}`;

		if (!groupDeps[key]) {
			groupDeps[key] = { from, to, forward: 0, reverse: 0 };
		}
		if (!groupDeps[reverseKey]) {
			groupDeps[reverseKey] = { from: to, to: from, forward: 0, reverse: 0 };
		}

		groupDeps[key].forward += count;
		groupDeps[reverseKey].reverse += count;
	}

	const processed = new Set();
	for (const dep of Object.values(groupDeps)) {
		const key = [dep.from, dep.to].sort().join("|");
		if (processed.has(key)) continue;
		processed.add(key);

		if (dep.forward > dep.reverse) {
			dependencyDirection.push({ dependent: dep.from, dependsOn: dep.to });
		} else if (dep.reverse > dep.forward) {
			dependencyDirection.push({ dependent: dep.to, dependsOn: dep.from });
		}
	}

	// File stats
	const fileStats = {
		totalFileNodes: fileNodes.length,
		filesPerGroup: {},
		nodeTypeCounts: {},
	};

	for (const [group, nodeIds] of Object.entries(directoryGroups)) {
		fileStats.filesPerGroup[group] = nodeIds.length;
	}

	for (const [type, nodeIds] of Object.entries(nodeTypeGroups)) {
		fileStats.nodeTypeCounts[type] = nodeIds.length;
	}

	// Output
	const output = {
		scriptCompleted: true,
		directoryGroups,
		nodeTypeGroups,
		crossCategoryEdges,
		interGroupImports,
		intraGroupDensity,
		patternMatches,
		deploymentTopology,
		dataPipeline,
		docCoverage,
		dependencyDirection,
		fileStats,
		fileFanIn: Object.fromEntries(
			Object.entries(fileFanIn)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 20),
		),
		fileFanOut: Object.fromEntries(
			Object.entries(fileFanOut)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 20),
		),
	};

	fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
	console.log("Analysis complete");
	process.exit(0);
} catch (error) {
	console.error("Error:", error.message);
	console.error(error.stack);
	process.exit(1);
}
