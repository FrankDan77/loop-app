import { spawn } from "node:child_process";
import {
	accessSync,
	existsSync,
	constants as fsConstants,
	mkdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import { getProcessEnvWithShellPath } from "../../../lib/trpc/routers/workspaces/utils/shell-env";
import { LOOP_HOME_DIR } from "../app-environment";
import { resolveLoopPluginDir } from "./paths";

/**
 * Bump when the install steps change so a stamped machine re-installs on upgrade.
 */
const LOOP_INSTALL_SCHEMA_VERSION = 1;

const STAMP_PATH = path.join(LOOP_HOME_DIR, "loop-install-state.json");

const REQUIRED_PREREQS = ["claude", "codex", "jq", "git"] as const;
export type LoopPrereq = (typeof REQUIRED_PREREQS)[number];

export interface LoopPrereqStatus {
	loopDir: string | null;
	prereqs: Record<LoopPrereq, boolean>;
}

export type LoopInstallStatus =
	| "installed"
	| "skipped"
	| "missing-plugin"
	| "codex-missing"
	| "codex-failed";

export interface LoopInstallResult {
	status: LoopInstallStatus;
	loopDir: string | null;
	prereqs: Record<LoopPrereq, boolean>;
	commit: string | null;
	detail?: string;
}

interface LoopInstallStamp {
	commit: string | null;
	schema: number;
	codexInstalled: boolean;
}

function readVendoredCommit(loopDir: string): string | null {
	const vendorFile = path.join(loopDir, "VENDOR.md");
	if (!existsSync(vendorFile)) return null;
	try {
		const contents = readFileSync(vendorFile, "utf-8");
		const match = contents.match(/^commit:\s*([0-9a-f]+)/im);
		return match?.[1] ?? null;
	} catch {
		return null;
	}
}

function findBinary(name: string, pathValue: string): boolean {
	const entries = pathValue.split(path.delimiter).filter(Boolean);
	for (const dir of entries) {
		const candidate = path.join(dir, name);
		try {
			accessSync(candidate, fsConstants.X_OK);
			if (statSync(candidate).isFile()) return true;
		} catch {
			// not here / not executable
		}
	}
	return false;
}

function detectPrereqs(pathValue: string): Record<LoopPrereq, boolean> {
	const result = {} as Record<LoopPrereq, boolean>;
	for (const bin of REQUIRED_PREREQS) {
		result[bin] = findBinary(bin, pathValue);
	}
	return result;
}

/**
 * Detect the vendored loop plugin dir and which required CLIs are on PATH.
 * Uses the login-shell PATH so it matches what terminals resolve.
 */
export async function detectLoopPrereqs(): Promise<LoopPrereqStatus> {
	const loopDir = resolveLoopPluginDir();
	const env = await getProcessEnvWithShellPath();
	const pathValue = env.PATH ?? process.env.PATH ?? "";
	return { loopDir, prereqs: detectPrereqs(pathValue) };
}

function readStamp(): LoopInstallStamp | null {
	if (!existsSync(STAMP_PATH)) return null;
	try {
		return JSON.parse(readFileSync(STAMP_PATH, "utf-8")) as LoopInstallStamp;
	} catch {
		return null;
	}
}

function writeStamp(stamp: LoopInstallStamp): void {
	try {
		mkdirSync(path.dirname(STAMP_PATH), { recursive: true });
		writeFileSync(STAMP_PATH, JSON.stringify(stamp, null, 2), "utf-8");
	} catch (error) {
		console.warn("[loop-install] Failed to write stamp:", error);
	}
}

function runInstallScript(
	loopDir: string,
	env: Record<string, string>,
): Promise<{ ok: boolean; output: string }> {
	const scriptPath = path.join(loopDir, "scripts", "install-skills-codex.sh");
	return new Promise((resolve) => {
		const child = spawn("bash", [scriptPath, "--repo-root", loopDir], {
			cwd: loopDir,
			env,
		});
		let output = "";
		const onData = (chunk: Buffer) => {
			output += chunk.toString();
		};
		child.stdout?.on("data", onData);
		child.stderr?.on("data", onData);

		const timer = setTimeout(() => {
			child.kill("SIGKILL");
			resolve({ ok: false, output: `${output}\n[loop-install] timed out` });
		}, 120_000);

		child.on("error", (error) => {
			clearTimeout(timer);
			resolve({ ok: false, output: `${output}\n${String(error)}` });
		});
		child.on("exit", (code) => {
			clearTimeout(timer);
			resolve({ ok: code === 0, output });
		});
	});
}

/**
 * Install the vendored loop plugin into the local Codex runtime
 * (`~/.codex/skills`, `hooks.json`, `config.toml`) via the plugin's own
 * install script. Idempotent and version-stamped so it only re-runs on upgrade.
 *
 * Claude Code integration does not need a global install: loop terminal
 * sessions launch `claude --plugin-dir <loopDir>` which exposes `/rloop:*`.
 */
export async function installLoopPlugin(
	options: { force?: boolean } = {},
): Promise<LoopInstallResult> {
	const loopDir = resolveLoopPluginDir();
	if (!loopDir) {
		console.warn("[loop-install] Vendored loop plugin not found; skipping");
		return {
			status: "missing-plugin",
			loopDir: null,
			prereqs: { claude: false, codex: false, jq: false, git: false },
			commit: null,
		};
	}

	const commit = readVendoredCommit(loopDir);
	const env = await getProcessEnvWithShellPath();
	const pathValue = env.PATH ?? process.env.PATH ?? "";
	const prereqs = detectPrereqs(pathValue);

	const stamp = readStamp();
	const stampMatches =
		stamp?.commit === commit && stamp?.schema === LOOP_INSTALL_SCHEMA_VERSION;

	if (!prereqs.codex) {
		// Nothing to install into Codex yet; stamp so we retry once codex appears.
		return {
			status: "codex-missing",
			loopDir,
			prereqs,
			commit,
			detail: "codex CLI not found on PATH",
		};
	}

	if (!options.force && stampMatches && stamp?.codexInstalled) {
		return { status: "skipped", loopDir, prereqs, commit };
	}

	const { ok, output } = await runInstallScript(loopDir, env);
	if (!ok) {
		console.warn(`[loop-install] Codex skill install failed:\n${output}`);
		return {
			status: "codex-failed",
			loopDir,
			prereqs,
			commit,
			detail: output.slice(-2000),
		};
	}

	writeStamp({
		commit,
		schema: LOOP_INSTALL_SCHEMA_VERSION,
		codexInstalled: true,
	});
	console.log("[loop-install] Loop skills installed into Codex runtime");
	return { status: "installed", loopDir, prereqs, commit };
}
