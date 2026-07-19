/**
 * Helpers for driving the vendored loop plugin (https://github.com/FrankDan77/loop-app)
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
 * Resume the exact Claude Code session that is driving a loop (its `session_id`
 * is persisted in the run's `.loop/rlcr/<session>/state.md` frontmatter by the
 * plugin's PostToolUse hook). `--resume <id>` appends to the same session id
 * (no `--fork-session`), so re-injected controls (Ctrl-C / "continue" / "try
 * again") act on the real run and the loop's Stop hook keeps matching. Session
 * ids are scoped to the worktree, so this must launch in the run's worktree.
 *
 * `--resume` only restores the conversation and then waits, so pass
 * `initialQuery` (e.g. "continue") to bake a first message that nudges Claude
 * to produce a turn and re-arm the loop's Stop hook — reliable at startup,
 * unlike typing into the REPL after an unknown boot delay.
 */
export function buildLoopClaudeResumeCommand(
	loopDir: string,
	sessionId: string,
	initialQuery?: string,
): string {
	const base = `claude --resume ${quoteShellArg(sessionId)} --dangerously-skip-permissions --plugin-dir ${quoteShellArg(loopDir)}`;
	return initialQuery ? `${base} ${quoteShellArg(initialQuery)}` : base;
}

// ========================================
// Orchestration slash commands / control keystrokes (v2)
//
// These are typed INTO a running loop Claude session (not launch args). The
// desktop Loop sidebar drives the half-automatic workflow by injecting them
// via `terminal.writeInput`, then watching the resulting `.loop/**` files.
// ========================================

/** Cancel an active RLCR loop (writes `.cancel-requested` + `cancel-state.md`). */
export const LOOP_CANCEL_COMMAND = `${LOOP_SLASH_PREFIX}cancel-rlcr-loop`;
/** Nudge Claude to retry the current round after an error (no native "restart"). */
export const LOOP_RETRY_TEXT = "try again";
/** Ask Claude to resume after a soft interrupt. */
export const LOOP_RESUME_TEXT = "continue";
/** Ctrl-C: interrupts Claude's current turn (best-effort "pause"). */
export const LOOP_INTERRUPT = "\u0003";
/**
 * Carriage return that submits a line in the Claude Code REPL. The host writes
 * bytes straight to the PTY (no CRLF translation) and Claude Code runs in raw
 * mode, where the Enter key is a CR (`\r`), not LF. Injected commands must be
 * followed by this to actually execute (a lone `\n` only inserts a newline).
 */
export const LOOP_SUBMIT = "\r";

/** Zero-padded `YYYYMMDD-HHMMSS` stamp matching the plugin's own slug scheme. */
function loopTimestamp(now: Date): string {
	const p = (n: number) => String(n).padStart(2, "0");
	return (
		`${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}` +
		`-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`
	);
}

/** Deterministic worktree-relative output path for a gen-idea draft. */
export function buildLoopIdeaOutputPath(now: Date = new Date()): string {
	return `.loop/ideas/loop-idea-${loopTimestamp(now)}.md`;
}

/** Deterministic worktree-relative output path for a gen-plan plan. */
export function buildLoopPlanOutputPath(now: Date = new Date()): string {
	return `.loop/plans/loop-plan-${loopTimestamp(now)}.md`;
}

// NOTE on quoting: `buildLoopClaudeLaunchWithPrompt` is a *shell* command (the
// prompt is a positional arg), so it gets `quoteShellArg`. The gen-plan /
// start-rlcr / cancel builders are typed into the *Claude REPL* (not a shell),
// so they are plain slash-command text. The worktree-relative paths we
// generate never contain spaces, so no in-REPL quoting is needed.

/**
 * Plain `/rloop:gen-idea <idea> --output <path>` text. Baked as Claude's
 * initial prompt via `buildLoopClaudeLaunchWithPrompt` so gen-idea runs on
 * startup (reliable) and writes the draft to a caller-chosen path the
 * orchestrator can watch.
 */
export function buildLoopGenIdeaPrompt(
	idea: string,
	outputRelPath: string,
): string {
	return `${LOOP_SLASH_PREFIX}gen-idea ${idea.trim()} --output ${outputRelPath}`;
}

/**
 * Launch Claude with the loop plugin AND an initial prompt (e.g. the gen-idea
 * slash command). The prompt is passed as one shell-quoted positional arg.
 */
export function buildLoopClaudeLaunchWithPrompt(
	loopDir: string,
	prompt: string,
): string {
	return `${buildLoopClaudeLaunchCommand(loopDir)} ${quoteShellArg(prompt)}`;
}

/**
 * `/rloop:gen-plan --input <draft> --output <plan>` (typed into the REPL).
 * Keeps the plugin's default discussion mode so the user can review the plan
 * before starting RLCR.
 */
export function buildLoopGenPlanCommand(
	inputRelPath: string,
	outputRelPath: string,
): string {
	return `${LOOP_SLASH_PREFIX}gen-plan --input ${inputRelPath} --output ${outputRelPath}`;
}

export interface LoopStartRlcrOptions {
	/** Skip the plan-understanding quiz so the loop starts unattended. */
	skipQuiz?: boolean;
	/** Allow a non-gitignored plan file (start-rlcr rejects tracked plans otherwise). */
	trackPlanFile?: boolean;
}

/** `/rloop:start-rlcr-loop <plan> [--skip-quiz] [--track-plan-file]` (REPL text). */
export function buildLoopStartRlcrCommand(
	planRelPath: string,
	options: LoopStartRlcrOptions = {},
): string {
	const flags: string[] = [];
	if (options.skipQuiz) flags.push("--skip-quiz");
	if (options.trackPlanFile) flags.push("--track-plan-file");
	const suffix = flags.length > 0 ? ` ${flags.join(" ")}` : "";
	return `${LOOP_SLASH_PREFIX}start-rlcr-loop ${planRelPath}${suffix}`;
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
