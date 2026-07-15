#!/usr/bin/env node
const fs = require("node:fs");
const dir = process.argv[2]; // intermediate dir
const scan = JSON.parse(fs.readFileSync(`${dir}/scan-script-out.json`, "utf8"));
const imp = JSON.parse(fs.readFileSync(`${dir}/import-map-out.json`, "utf8"));

const result = {
	projectName: "@superset/desktop",
	projectDescription:
		'Superset desktop app — an Electron-based developer tool ("the last developer tool you\'ll ever need"). React renderer (TanStack Router + Query, Zustand stores, Tailwind/shadcn UI) talking to an Electron main process over tRPC-electron IPC; integrates AI SDK agents, terminal/PTY hosting, workspace management, and Better Auth.',
	languages: Object.keys(scan.stats.byLanguage).sort(),
	frameworks: [
		"Electron",
		"React",
		"TanStack Router",
		"TanStack Query",
		"Zustand",
		"tRPC",
		"Tailwind CSS",
		"Vite",
		"electron-vite",
		"Better Auth",
		"AI SDK",
		"CodeMirror",
		"Biome",
	],
	files: scan.files,
	totalFiles: scan.totalFiles,
	filteredByIgnore: scan.filteredByIgnore,
	estimatedComplexity: scan.estimatedComplexity,
	stats: scan.stats,
	importMap: imp.importMap,
};
fs.writeFileSync(`${dir}/scan-result.json`, JSON.stringify(result, null, 2));
console.log(
	"scan-result.json written:",
	result.totalFiles,
	"files,",
	Object.keys(imp.importMap).length,
	"importMap entries",
);
