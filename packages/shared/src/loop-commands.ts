/**
 * Helpers for driving the vendored loop plugin (https://github.com/FrankDan77/loop)
 * from the desktop UI. The loop plugin is a Claude Code plugin whose commands use
 * the `/rloop:` prefix, plus a `loop monitor` CLI sourced from `scripts/loop.sh`.
 *
 * These are pure string builders: the UI resolves the absolute plugin dir via
 * the `settings.loopStatus` tRPC query and launches terminals with the resulting
 * `initialCommand`.
 */

/** Slash-command prefix exposed by the loop Claude Code plugin (plugin.json name = "rloop"). */
export const LOOP_SLASH_PREFIX = "/rloop:";

/**
 * High-level phases surfaced in the Loop UI, mapped onto the loop plugin's
 * underlying `/rloop:*` commands. `refine` is optional (only when a plan has
 * reviewer annotations); `run` covers implementation + Codex review (RLCR).
 */
export const LOOP_PHASES = ["idea", "plan", "refine", "run"] as const;
export type LoopPhase = (typeof LOOP_PHASES)[number];

export type LoopMonitorTarget = "rlcr" | "skill" | "codex" | "gemini";

/** POSIX single-quote a value so it survives being embedded in a shell command. */
export function quoteShellArg(value: string): string {
	return `'${value.replaceAll("'", `'"'"'`)}'`;
}

/**
 * Command that launches Claude Code with the loop plugin loaded, so `/rloop:*`
 * commands are available in that session.
 */
export function buildLoopClaudeLaunchCommand(loopDir: string): string {
	return `claude --dangerously-skip-permissions --plugin-dir ${quoteShellArg(loopDir)}`;
}

/**
 * Command that sources the loop monitor helper and starts a monitor dashboard.
 * Run in a separate terminal, not inside the Claude session.
 */
export function buildLoopMonitorCommand(
	loopDir: string,
	target: LoopMonitorTarget = "rlcr",
): string {
	const loopScript = `${loopDir.replace(/\/$/, "")}/scripts/loop.sh`;
	return `source ${quoteShellArg(loopScript)} && loop monitor ${target}`;
}

export interface RloopCommandOptions {
	/** Draft idea input for gen-idea, or free-form prompt. */
	idea?: string;
	/** Input file path (draft for gen-plan, annotated plan for refine-plan). */
	input?: string;
	/** Output file path (plan for gen-plan). */
	output?: string;
	/** Plan file path for start-rlcr-loop. */
	planFile?: string;
	/** Extra raw flags appended verbatim (already shell-safe). */
	extraArgs?: string[];
}

/**
 * Build the `/rloop:*` slash command string to send into a loop Claude session
 * for a given phase.
 */
export function buildRloopSlashCommand(
	phase: LoopPhase,
	options: RloopCommandOptions = {},
): string {
	const extra = options.extraArgs?.length
		? ` ${options.extraArgs.join(" ")}`
		: "";

	switch (phase) {
		case "idea": {
			const arg = options.idea ? ` ${quoteShellArg(options.idea)}` : "";
			return `${LOOP_SLASH_PREFIX}gen-idea${arg}${extra}`;
		}
		case "plan": {
			const input = options.input
				? ` --input ${quoteShellArg(options.input)}`
				: "";
			const output = options.output
				? ` --output ${quoteShellArg(options.output)}`
				: "";
			return `${LOOP_SLASH_PREFIX}gen-plan${input}${output}${extra}`;
		}
		case "refine": {
			const input = options.input
				? ` --input ${quoteShellArg(options.input)}`
				: "";
			return `${LOOP_SLASH_PREFIX}refine-plan${input}${extra}`;
		}
		case "run": {
			const plan = options.planFile
				? ` ${quoteShellArg(options.planFile)}`
				: "";
			return `${LOOP_SLASH_PREFIX}start-rlcr-loop${plan}${extra}`;
		}
	}
}

/** Slash command to cancel an active RLCR loop. */
export function buildRloopCancelCommand(): string {
	return `${LOOP_SLASH_PREFIX}cancel-rlcr-loop`;
}

export interface LoopPhaseDescriptor {
	phase: LoopPhase;
	label: string;
	description: string;
	optional?: boolean;
}

/** Ordered, user-facing descriptors for the Loop workflow phases. */
export const LOOP_PHASE_DESCRIPTORS: readonly LoopPhaseDescriptor[] = [
	{
		phase: "idea",
		label: "Idea",
		description: "Turn a loose thought into an idea draft with Claude.",
	},
	{
		phase: "plan",
		label: "Plan",
		description: "Generate a structured implementation plan from the draft.",
	},
	{
		phase: "refine",
		label: "Refine",
		description: "Fold reviewer comments back into the plan (optional).",
		optional: true,
	},
	{
		phase: "run",
		label: "Run (RLCR)",
		description: "Claude implements; Codex reviews each round until done.",
	},
] as const;
