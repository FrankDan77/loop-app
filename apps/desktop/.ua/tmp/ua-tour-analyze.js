#!/usr/bin/env node

const fs = require("node:fs");

function main() {
	if (process.argv.length < 4) {
		console.error("Usage: node ua-tour-analyze.js <input.json> <output.json>");
		process.exit(1);
	}

	const inputPath = process.argv[2];
	const outputPath = process.argv[3];

	let data;
	try {
		const raw = fs.readFileSync(inputPath, "utf-8");
		data = JSON.parse(raw);
	} catch (err) {
		console.error("Failed to read or parse input file:", err.message);
		process.exit(1);
	}

	const { nodes, edges, layers } = data;

	if (!Array.isArray(nodes) || !Array.isArray(edges)) {
		console.error('Input must have "nodes" and "edges" arrays');
		process.exit(1);
	}

	// Build adjacency lists
	const outgoing = new Map(); // source -> [targets]
	const incoming = new Map(); // target -> [sources]

	for (const edge of edges) {
		const { source, target } = edge;
		if (!outgoing.has(source)) outgoing.set(source, []);
		if (!incoming.has(target)) incoming.set(target, []);
		outgoing.get(source).push(target);
		incoming.get(target).push(source);
	}

	// A. Fan-In Ranking
	const fanInMap = new Map();
	for (const node of nodes) {
		fanInMap.set(
			node.id,
			incoming.has(node.id) ? incoming.get(node.id).length : 0,
		);
	}
	const fanInRanking = nodes
		.map((n) => ({ id: n.id, fanIn: fanInMap.get(n.id), name: n.name || n.id }))
		.sort((a, b) => b.fanIn - a.fanIn)
		.slice(0, 20);

	// B. Fan-Out Ranking
	const fanOutMap = new Map();
	for (const node of nodes) {
		fanOutMap.set(
			node.id,
			outgoing.has(node.id) ? outgoing.get(node.id).length : 0,
		);
	}
	const fanOutRanking = nodes
		.map((n) => ({
			id: n.id,
			fanOut: fanOutMap.get(n.id),
			name: n.name || n.id,
		}))
		.sort((a, b) => b.fanOut - a.fanOut)
		.slice(0, 20);

	// C. Entry Point Candidates
	const entryFileNames = new Set([
		"index.ts",
		"index.js",
		"main.ts",
		"main.js",
		"app.ts",
		"app.js",
		"server.ts",
		"server.js",
		"mod.rs",
		"main.go",
		"main.py",
		"main.rs",
		"manage.py",
		"app.py",
		"wsgi.py",
		"asgi.py",
		"run.py",
		"__main__.py",
		"Application.java",
		"Main.java",
		"Program.cs",
		"config.ru",
		"index.php",
		"App.swift",
		"Application.kt",
		"main.cpp",
		"main.c",
	]);

	const fanOutThreshold =
		fanOutRanking[Math.floor(fanOutRanking.length * 0.1)]?.fanOut || 0;
	const fanInThreshold =
		fanInRanking[Math.floor(fanInRanking.length * 0.75)]?.fanIn || 0;

	const entryPointCandidates = nodes
		.map((node) => {
			let score = 0;
			const name = node.name || "";
			const filePath = node.filePath || "";

			// Documentation priority
			if (
				node.type === "document" &&
				name === "README.md" &&
				!filePath.includes("/")
			) {
				score += 5;
			} else if (
				node.type === "document" &&
				name.endsWith(".md") &&
				!filePath.includes("/")
			) {
				score += 2;
			}

			// Code entry points
			if (node.type === "file") {
				if (entryFileNames.has(name)) {
					score += 3;
				}
				const depth = (filePath.match(/\//g) || []).length;
				if (depth <= 1) {
					score += 1;
				}
				const fanOut = fanOutMap.get(node.id) || 0;
				const fanIn = fanInMap.get(node.id) || 0;
				if (fanOut >= fanOutThreshold) {
					score += 1;
				}
				if (fanIn <= fanInThreshold) {
					score += 1;
				}
			}

			return {
				id: node.id,
				score,
				name: node.name || node.id,
				summary: node.summary || "",
				type: node.type,
			};
		})
		.filter((c) => c.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, 5);

	// D. BFS Traversal from top code entry point
	const codeEntryPoint = entryPointCandidates.find((c) => c.type === "file");
	const bfsTraversal = {
		startNode: null,
		order: [],
		depthMap: {},
		byDepth: {},
	};

	if (codeEntryPoint) {
		const startId = codeEntryPoint.id;
		bfsTraversal.startNode = startId;

		const visited = new Set();
		const queue = [{ id: startId, depth: 0 }];
		const order = [];
		const depthMap = {};
		const byDepth = {};

		while (queue.length > 0) {
			const { id, depth } = queue.shift();
			if (visited.has(id)) continue;
			visited.add(id);
			order.push(id);
			depthMap[id] = depth;
			if (!byDepth[depth]) byDepth[depth] = [];
			byDepth[depth].push(id);

			// Follow imports/calls edges
			const targets = outgoing.get(id) || [];
			for (const target of targets) {
				if (!visited.has(target)) {
					queue.push({ id: target, depth: depth + 1 });
				}
			}
		}

		bfsTraversal.order = order;
		bfsTraversal.depthMap = depthMap;
		bfsTraversal.byDepth = byDepth;
	}

	// E. Non-Code File Inventory
	const nonCodeFiles = {
		documentation: [],
		infrastructure: [],
		data: [],
		config: [],
	};

	for (const node of nodes) {
		const item = {
			id: node.id,
			name: node.name || node.id,
			summary: node.summary || "",
			type: node.type,
		};

		if (node.type === "document") {
			nonCodeFiles.documentation.push(item);
		} else if (["service", "pipeline", "resource"].includes(node.type)) {
			nonCodeFiles.infrastructure.push(item);
		} else if (["table", "schema", "endpoint"].includes(node.type)) {
			nonCodeFiles.data.push(item);
		} else if (node.type === "config") {
			nonCodeFiles.config.push(item);
		}
	}

	// F. Tightly Coupled Clusters
	const bidirectional = new Map(); // id -> Set of ids with bidirectional edges
	for (const node of nodes) {
		bidirectional.set(node.id, new Set());
	}

	for (const edge of edges) {
		const { source, target } = edge;
		const reverseExists = edges.some(
			(e) => e.source === target && e.target === source,
		);
		if (reverseExists) {
			bidirectional.get(source).add(target);
			bidirectional.get(target).add(source);
		}
	}

	const clusterSet = [];
	const clustered = new Set();

	for (const [id, connections] of bidirectional) {
		if (clustered.has(id) || connections.size === 0) continue;

		const cluster = new Set([id]);
		clustered.add(id);

		// Add directly connected nodes
		for (const connId of connections) {
			if (!clustered.has(connId)) {
				cluster.add(connId);
				clustered.add(connId);
			}
		}

		// Expand: add nodes connected to 2+ cluster members
		for (const node of nodes) {
			if (clustered.has(node.id)) continue;
			const nodeConnections = bidirectional.get(node.id);
			let connectCount = 0;
			for (const clusterId of cluster) {
				if (nodeConnections.has(clusterId)) connectCount++;
			}
			if (connectCount >= 2) {
				cluster.add(node.id);
				clustered.add(node.id);
			}
		}

		if (cluster.size >= 2 && cluster.size <= 5) {
			const edgeCount = edges.filter(
				(e) => cluster.has(e.source) && cluster.has(e.target),
			).length;
			clusterSet.push({ nodes: Array.from(cluster), edgeCount });
		}
	}

	const clusters = clusterSet
		.sort((a, b) => b.edgeCount - a.edgeCount)
		.slice(0, 10);

	// G. Layers
	const layersInfo = {
		count: Array.isArray(layers) ? layers.length : 0,
		list: Array.isArray(layers) ? layers : [],
	};

	// H. Node Summary Index
	const nodeSummaryIndex = {};
	for (const node of nodes) {
		nodeSummaryIndex[node.id] = {
			name: node.name || node.id,
			type: node.type || "unknown",
			summary: node.summary || "",
		};
	}

	// Output
	const result = {
		scriptCompleted: true,
		entryPointCandidates,
		fanInRanking,
		fanOutRanking,
		bfsTraversal,
		nonCodeFiles,
		clusters,
		layers: layersInfo,
		nodeSummaryIndex,
		totalNodes: nodes.length,
		totalEdges: edges.length,
	};

	try {
		fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
		console.log("Analysis complete.");
	} catch (err) {
		console.error("Failed to write output file:", err.message);
		process.exit(1);
	}
}

main();
