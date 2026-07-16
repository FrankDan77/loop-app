import {
	buildLoopGenIdeaPrompt,
	buildLoopGenPlanCommand,
	buildLoopIdeaOutputPath,
	buildLoopPlanOutputPath,
	buildLoopStartRlcrCommand,
	LOOP_CANCEL_COMMAND,
	LOOP_INTERRUPT,
	LOOP_RESUME_TEXT,
	LOOP_RETRY_TEXT,
	LOOP_SLASH_PREFIX,
	LOOP_SUBMIT,
} from "@superset/shared/loop-commands";
import { toast } from "@superset/ui/sonner";
import { workspaceTrpc } from "@superset/workspace-client";
import { useCallback, useEffect, useRef } from "react";
import type { LoopSessionState } from "renderer/routes/_authenticated/providers/CollectionsProvider/dashboardSidebarLocal";
import type { LoopRlcrStatus } from "../useLoopStatus";

/** Delay between typing a command and pressing Enter, so the Claude Code REPL
 *  registers the full line before it submits. */
const SUBMIT_DELAY_MS = 150;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Options for launching the loop Claude terminal. */
export interface CreateLoopTerminalOptions {
	/** Bake this as Claude's first prompt (e.g. the gen-idea slash command). */
	initialPrompt?: string;
	/** Resume this Claude Code session id (`claude --resume`) instead of a fresh
	 *  session, so the reattached terminal drives the same running loop. */
	resumeSessionId?: string;
}

/** Callback that launches the loop Claude terminal and returns its terminalId,
 *  or null if it couldn't start. */
export type CreateLoopTerminal = (
	options?: CreateLoopTerminalOptions,
) => Promise<string | null>;

interface UseLoopOrchestratorOptions {
	workspaceId: string;
	worktreePath: string;
	loopState: LoopSessionState;
	setLoopState: (patch: Partial<LoopSessionState>) => void;
	status: LoopRlcrStatus | null;
	onCreateLoopTerminal: CreateLoopTerminal;
}

export interface LoopOrchestratorApi {
	/** Launch the loop terminal, bake gen-idea, and begin the auto flow. */
	startFromIdea: (idea: string) => Promise<void>;
	/** Kick off the RLCR loop from the reviewed plan (user-confirmed). */
	startRlcr: () => Promise<void>;
	/** Cancel the active RLCR loop (`/rloop:cancel-rlcr-loop`). */
	stop: () => Promise<void>;
	/** Nudge Claude to retry after an error ("try again"). */
	retry: () => Promise<void>;
	/** Interrupt Claude's current turn (Ctrl-C, best-effort pause). */
	interrupt: () => Promise<void>;
	/** Ask Claude to continue after an interrupt. */
	resume: () => Promise<void>;
	/** Fold reviewer comments into the plan (`/rloop:refine-plan`). */
	refinePlan: () => Promise<void>;
	/**
	 * Adopt an existing (active) RLCR session into the panel so its live monitor
	 * + controls take over. Pins the session dir and keeps the current terminal
	 * (if any) so callers can decide whether to reattach a control terminal.
	 */
	adopt: (sessionDir: string, planRelPath: string | null) => void;
	/** Launch a fresh loop Claude terminal and pin it as the control terminal. */
	reattach: () => Promise<void>;
	/** Reset back to the idle idea form (does not touch the terminal). */
	reset: () => void;
	isSending: boolean;
}

function toRelative(worktreePath: string, absolutePath: string): string {
	const prefix = `${worktreePath.replace(/\/$/, "")}/`;
	return absolutePath.startsWith(prefix)
		? absolutePath.slice(prefix.length)
		: absolutePath;
}

function joinPath(base: string, rel: string): string {
	return `${base.replace(/\/$/, "")}/${rel.replace(/^\//, "")}`;
}

/**
 * Drives the half-automatic Loop workflow by injecting slash commands into the
 * loop Claude terminal and watching the resulting `.loop/**` artifacts:
 *   idle → (gen-idea) → genIdea → (auto gen-plan) → genPlan → planReview
 *   → (user Start RLCR) → rlcrRunning → done | ended
 *
 * gen-idea is baked as Claude's initial prompt (reliable on startup); every
 * later command is typed into the running REPL.
 */
export function useLoopOrchestrator({
	workspaceId,
	worktreePath,
	loopState,
	setLoopState,
	status,
	onCreateLoopTerminal,
}: UseLoopOrchestratorOptions): LoopOrchestratorApi {
	const utils = workspaceTrpc.useUtils();
	const writeInput = workspaceTrpc.terminal.writeInput.useMutation();

	// Type a command into the loop Claude REPL, then press Enter. Claude Code
	// runs in raw mode where Enter is a CR (`\r`); a lone `\n` only inserts a
	// newline, so we send the trimmed text and, after a short delay, `\r` to
	// actually submit it.
	const submitCommand = useCallback(
		async (terminalId: string, text: string) => {
			try {
				await writeInput.mutateAsync({
					workspaceId,
					terminalId,
					data: text.replace(/[\r\n]+$/, ""),
				});
				await delay(SUBMIT_DELAY_MS);
				await writeInput.mutateAsync({
					workspaceId,
					terminalId,
					data: LOOP_SUBMIT,
				});
			} catch (error) {
				toast.error("Couldn't send command to Loop terminal", {
					description: error instanceof Error ? error.message : String(error),
				});
				throw error;
			}
		},
		[writeInput, workspaceId],
	);

	const sendRaw = useCallback(
		async (terminalId: string, data: string) => {
			try {
				await writeInput.mutateAsync({ workspaceId, terminalId, data });
			} catch (error) {
				toast.error("Couldn't send keystroke to Loop terminal", {
					description: error instanceof Error ? error.message : String(error),
				});
			}
		},
		[writeInput, workspaceId],
	);

	const readText = useCallback(
		async (absolutePath: string): Promise<string | null> => {
			try {
				const result = await utils.filesystem.readFile.fetch({
					workspaceId,
					absolutePath,
					encoding: "utf-8",
					maxBytes: 200_000,
				});
				return result.kind === "text" ? result.content : null;
			} catch {
				return null;
			}
		},
		[utils, workspaceId],
	);

	const startFromIdea = useCallback(
		async (idea: string) => {
			const trimmed = idea.trim();
			if (!trimmed || !worktreePath) return;
			const ideaRel = buildLoopIdeaOutputPath();
			const prompt = buildLoopGenIdeaPrompt(trimmed, ideaRel);
			const terminalId = await onCreateLoopTerminal({ initialPrompt: prompt });
			if (!terminalId) return;
			setLoopState({
				phase: "genIdea",
				terminalId,
				ideaText: trimmed,
				ideaPath: joinPath(worktreePath, ideaRel),
				planPath: null,
				planRelPath: null,
				sessionDir: null,
			});
		},
		[worktreePath, onCreateLoopTerminal, setLoopState],
	);

	const startRlcr = useCallback(async () => {
		const { terminalId, planRelPath } = loopState;
		if (!terminalId || !planRelPath || !worktreePath) return;
		// Snapshot the sessions that already exist so the monitor ignores any
		// prior (e.g. completed) loops and only adopts the one this run creates.
		let preStartSessions: string[] = [];
		try {
			const listing = await utils.filesystem.listDirectory.fetch({
				workspaceId,
				absolutePath: joinPath(worktreePath, ".loop/rlcr"),
			});
			preStartSessions = listing.entries
				.filter((e) => e.kind === "directory")
				.map((e) => e.name);
		} catch {
			// No .loop/rlcr yet (first loop in this worktree) — empty snapshot.
		}
		await submitCommand(
			terminalId,
			buildLoopStartRlcrCommand(planRelPath, { skipQuiz: true }),
		);
		setLoopState({ phase: "rlcrRunning", preStartSessions, sessionDir: null });
	}, [
		loopState,
		worktreePath,
		utils,
		workspaceId,
		submitCommand,
		setLoopState,
	]);

	const stop = useCallback(async () => {
		if (!loopState.terminalId) return;
		await submitCommand(loopState.terminalId, LOOP_CANCEL_COMMAND);
	}, [loopState.terminalId, submitCommand]);

	const retry = useCallback(async () => {
		if (!loopState.terminalId) return;
		await submitCommand(loopState.terminalId, LOOP_RETRY_TEXT);
	}, [loopState.terminalId, submitCommand]);

	const interrupt = useCallback(async () => {
		if (!loopState.terminalId) return;
		await sendRaw(loopState.terminalId, LOOP_INTERRUPT);
	}, [loopState.terminalId, sendRaw]);

	const resume = useCallback(async () => {
		if (!loopState.terminalId) return;
		await submitCommand(loopState.terminalId, LOOP_RESUME_TEXT);
	}, [loopState.terminalId, submitCommand]);

	const refinePlan = useCallback(async () => {
		const { terminalId, planRelPath } = loopState;
		if (!terminalId || !planRelPath) return;
		await submitCommand(
			terminalId,
			`${LOOP_SLASH_PREFIX}refine-plan --input ${planRelPath}`,
		);
	}, [loopState, submitCommand]);

	const adopt = useCallback(
		(sessionDir: string, planRelPath: string | null) => {
			setLoopState({
				phase: "rlcrRunning",
				sessionDir,
				planRelPath,
				planPath: planRelPath ? joinPath(worktreePath, planRelPath) : null,
				preStartSessions: [],
				ideaText: null,
				ideaPath: null,
			});
		},
		[worktreePath, setLoopState],
	);

	const reattach = useCallback(async () => {
		// Resume the loop's own Claude session when we know it, so injected
		// controls drive the real run; otherwise fall back to a fresh session.
		// `--resume` only restores + waits, so bake "continue" as the first
		// message to nudge Claude and re-arm the loop's Stop hook automatically.
		const resumeSessionId = status?.claudeSessionId ?? undefined;
		const terminalId = await onCreateLoopTerminal(
			resumeSessionId
				? { resumeSessionId, initialPrompt: LOOP_RESUME_TEXT }
				: undefined,
		);
		if (terminalId) setLoopState({ terminalId });
	}, [onCreateLoopTerminal, setLoopState, status]);

	const reset = useCallback(() => {
		setLoopState({
			phase: "idle",
			terminalId: null,
			ideaText: null,
			ideaPath: null,
			planPath: null,
			planRelPath: null,
			sessionDir: null,
			preStartSessions: [],
		});
	}, [setLoopState]);

	// --- Auto-advance: gen-idea draft appears + stabilizes → send gen-plan ---
	const genIdeaLenRef = useRef(-1);
	useEffect(() => {
		if (loopState.phase !== "genIdea") return;
		const terminalId = loopState.terminalId;
		const ideaPath = loopState.ideaPath;
		if (!terminalId || !ideaPath || !worktreePath) return;
		genIdeaLenRef.current = -1;
		let cancelled = false;

		const check = async () => {
			const content = await readText(ideaPath);
			if (cancelled) return;
			if (content !== null && content.length > 0) {
				if (content.length === genIdeaLenRef.current) {
					cancelled = true;
					clearInterval(id);
					const planRel = buildLoopPlanOutputPath();
					const ideaRel = toRelative(worktreePath, ideaPath);
					try {
						await submitCommand(
							terminalId,
							buildLoopGenPlanCommand(ideaRel, planRel),
						);
						setLoopState({
							phase: "genPlan",
							planPath: joinPath(worktreePath, planRel),
							planRelPath: planRel,
						});
					} catch {
						// submitCommand already toasted; stay in genIdea so the user
						// can retry from the terminal.
					}
					return;
				}
			}
			genIdeaLenRef.current = content?.length ?? -1;
		};

		const id = setInterval(check, 1200);
		void check();
		return () => {
			cancelled = true;
			clearInterval(id);
		};
	}, [
		loopState.phase,
		loopState.terminalId,
		loopState.ideaPath,
		worktreePath,
		readText,
		submitCommand,
		setLoopState,
	]);

	// --- Auto-advance: gen-plan output appears + converges → planReview ---
	const genPlanLenRef = useRef(-1);
	useEffect(() => {
		if (loopState.phase !== "genPlan") return;
		const planPath = loopState.planPath;
		if (!planPath) return;
		genPlanLenRef.current = -1;
		let cancelled = false;

		const check = async () => {
			const content = await readText(planPath);
			if (cancelled || content === null) return;
			const converged =
				content.includes("## Claude-Codex Deliberation") ||
				content.includes("Final Status:");
			if (
				content.length > 0 &&
				converged &&
				content.length === genPlanLenRef.current
			) {
				cancelled = true;
				clearInterval(id);
				setLoopState({ phase: "planReview" });
				return;
			}
			genPlanLenRef.current = content.length;
		};

		const id = setInterval(check, 1500);
		void check();
		return () => {
			cancelled = true;
			clearInterval(id);
		};
	}, [loopState.phase, loopState.planPath, readText, setLoopState]);

	// --- rlcrRunning: adopt the session dir + settle terminal states ---
	useEffect(() => {
		if (loopState.phase !== "rlcrRunning" || !status) return;
		if (status.isTerminal) {
			setLoopState({
				phase: status.status === "complete" ? "done" : "ended",
				sessionDir: status.sessionDir,
			});
			return;
		}
		if (status.sessionDir && loopState.sessionDir !== status.sessionDir) {
			setLoopState({ sessionDir: status.sessionDir });
		}
	}, [loopState.phase, loopState.sessionDir, status, setLoopState]);

	return {
		startFromIdea,
		startRlcr,
		stop,
		retry,
		interrupt,
		resume,
		refinePlan,
		adopt,
		reattach,
		reset,
		isSending: writeInput.isPending,
	};
}
