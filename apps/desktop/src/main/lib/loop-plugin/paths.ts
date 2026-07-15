import { existsSync } from "node:fs";
import path from "node:path";
import { app } from "electron";

/**
 * Marker file/dir that proves a directory is a valid vendored loop plugin root.
 * The loop plugin ships a `.claude-plugin/plugin.json` and a `scripts/` dir.
 */
function isLoopPluginDir(dir: string): boolean {
	return (
		existsSync(path.join(dir, ".claude-plugin", "plugin.json")) &&
		existsSync(path.join(dir, "scripts", "install-skills-codex.sh"))
	);
}

function getLoopPluginCandidates(): string[] {
	const candidates = [
		// Packaged: extraResources copies dist/resources/loop -> resources/loop
		app.isPackaged ? path.join(process.resourcesPath, "resources/loop") : null,
		// Compiled main bundle sits in dist/main, resources copied alongside
		path.join(__dirname, "../resources/loop"),
		// Dev / build output
		path.join(app.getAppPath(), "dist/resources/loop"),
		// Committed vendored source (dev, before bundle step runs)
		path.resolve(app.getAppPath(), "vendor/loop"),
		path.resolve(app.getAppPath(), "../../apps/desktop/vendor/loop"),
	];

	return candidates.filter((candidate): candidate is string => !!candidate);
}

/**
 * Resolve the on-disk directory of the vendored loop plugin, or null if not
 * bundled. Mirrors {@link resolveBundledCliPath} in bundled-cli.ts.
 */
export function resolveLoopPluginDir(): string | null {
	return (
		getLoopPluginCandidates().find((candidate) => isLoopPluginDir(candidate)) ??
		null
	);
}
