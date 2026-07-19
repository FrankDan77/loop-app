import { chmodSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { LOOP_DIR_NAME } from "shared/constants";

const LOOP_HOME_DIR_ENV = "LOOP_HOME_DIR";

export const LOOP_HOME_DIR =
	process.env[LOOP_HOME_DIR_ENV] || join(homedir(), LOOP_DIR_NAME);
process.env[LOOP_HOME_DIR_ENV] = LOOP_HOME_DIR;

export const LOOP_HOME_DIR_MODE = 0o700;
export const LOOP_SENSITIVE_FILE_MODE = 0o600;

export function ensureLoopHomeDirExists(): void {
	if (!existsSync(LOOP_HOME_DIR)) {
		mkdirSync(LOOP_HOME_DIR, {
			recursive: true,
			mode: LOOP_HOME_DIR_MODE,
		});
	}

	// Best-effort repair if the directory already existed with weak permissions.
	try {
		chmodSync(LOOP_HOME_DIR, LOOP_HOME_DIR_MODE);
	} catch (error) {
		console.warn(
			"[app-environment] Failed to chmod Loop home dir (best-effort):",
			LOOP_HOME_DIR,
			error,
		);
	}
}

// For lowdb - use our own path instead of app.getPath("userData")
export const APP_STATE_PATH = join(LOOP_HOME_DIR, "app-state.json");

// Window geometry state (separate from UI state - main process only, sync I/O)
export const WINDOW_STATE_PATH = join(LOOP_HOME_DIR, "window-state.json");
