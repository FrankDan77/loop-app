import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const desktopDir = resolve(import.meta.dirname, "..");
const source = resolve(desktopDir, "vendor/loop");
const dest = resolve(desktopDir, "dist/resources/loop");

if (!existsSync(source)) {
	throw new Error(
		`[desktop] Vendored loop plugin not found at ${source}. Re-vendor from https://github.com/FrankDan77/loop`,
	);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(source, dest, { recursive: true });

console.log(`[desktop] bundled loop plugin copied to ${dest}`);
