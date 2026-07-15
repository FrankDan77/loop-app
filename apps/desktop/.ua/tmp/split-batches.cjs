#!/usr/bin/env node
// Split batches.json into per-batch dispatch files + the extract-structure input.
const fs = require("node:fs");
const _path = require("node:path");
const uaDir = process.argv[2];
const projectRoot = process.argv[3];
const b = JSON.parse(
	fs.readFileSync(`${uaDir}/intermediate/batches.json`, "utf8"),
);
const tmp = `${uaDir}/tmp`;
let n = 0;
for (const batch of b.batches) {
	const idx = batch.batchIndex;
	const files = batch.files || batch.batchFiles || [];
	// Pre-build the extract-structure.mjs input (agent Step 1 output).
	const extractInput = {
		projectRoot,
		batchFiles: files.map((f) => ({
			path: f.path,
			language: f.language,
			sizeLines: f.sizeLines,
			fileCategory: f.fileCategory,
		})),
		batchImportData: batch.batchImportData || {},
	};
	fs.writeFileSync(
		`${tmp}/ua-file-analyzer-input-${idx}.json`,
		JSON.stringify(extractInput),
	);
	// Dispatch context file: everything the subagent needs to reference.
	const dispatch = {
		batchIndex: idx,
		totalBatches: b.totalBatches,
		files: extractInput.batchFiles,
		batchImportData: batch.batchImportData || {},
		neighborMap: batch.neighborMap || {},
	};
	fs.writeFileSync(`${tmp}/dispatch-${idx}.json`, JSON.stringify(dispatch));
	n++;
}
console.log("wrote", n, "dispatch + extract-input files to", tmp);
