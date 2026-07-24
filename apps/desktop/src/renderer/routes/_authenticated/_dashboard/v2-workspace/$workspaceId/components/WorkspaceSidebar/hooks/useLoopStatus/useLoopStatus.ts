import { workspaceTrpc } from "@superset/workspace-client";
import { useQuery } from "@tanstack/react-query";
import { useWorkspaceEvent } from "renderer/hooks/host-service/useWorkspaceEvent";
import {
	type AcItem,
	derivePhaseLabel,
	detectStatusFromFiles,
	findLatestRoundFile,
	isRoundSummaryFilled,
	isTerminalLoopStatus,
	type LoopRunStatus,
	parseGoalTracker,
	parseStateFields,
	type TaskItem,
} from "./parseLoopStatus";

const SESSION_NAME_RE = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/;
const MAX_ROUND_BYTES = 20_000;

export interface LoopRlcrStatus {
	sessionDir: string;
	sessionName: string;
	status: LoopRunStatus;
	phaseLabel: string;
	isTerminal: boolean;
	currentRound: number | null;
	maxIterations: number | null;
	reviewStarted: boolean;
	codexModel: string | null;
	codexEffort: string | null;
	startedAt: string | null;
	/** Worktree-relative plan path recorded in state.md (used to correlate the
	 *  session with the run that created it). */
	planFile: string | null;
	/** Claude Code session id driving the run, for `claude --resume` reattach. */
	claudeSessionId: string | null;
	driftStatus: string | null;
	mainlineStallCount: number | null;
	goal: string | null;
	/** Active tasks from the goal tracker with their raw per-task status. */
	tasks: TaskItem[];
	/** Acceptance criteria with per-criterion status (finished/in_progress/pending). */
	acs: AcItem[];
	acsTotal: number;
	acsCompleted: number;
	tasksActive: number;
	tasksCompleted: number;
	tasksDeferred: number;
	openIssues: number;
	latestRoundLabel: string | null;
	latestRoundText: string | null;
}

function joinPath(...parts: string[]): string {
	return parts
		.map((p, i) => (i === 0 ? p.replace(/\/$/, "") : p.replace(/^\/|\/$/g, "")))
		.filter((p) => p.length > 0)
		.join("/");
}

function basename(absolutePath: string): string {
	return absolutePath.replace(/\/$/, "").split("/").pop() ?? absolutePath;
}

interface UseLoopStatusOptions {
	workspaceId: string;
	worktreePath: string;
	enabled: boolean;
	/**
	 * Worktree-relative plan path of the current run. When set, the session
	 * whose `state.md` records this `plan_file` is preferred, uniquely locking
	 * onto the loop we started even when older sessions exist.
	 */
	planRelPath?: string | null;
	/**
	 * Session directory names that existed before the current run started.
	 * These are excluded so a prior (e.g. completed) loop is never adopted.
	 */
	preStartSessions?: readonly string[];
	/**
	 * Read this exact session directory (absolute path) instead of scanning.
	 * Used once the run's session is pinned, and for the read-only history view.
	 */
	sessionDirOverride?: string | null;
}

interface UseLoopStatusResult {
	status: LoopRlcrStatus | null;
	isLoading: boolean;
	refetch: () => void;
}

/**
 * Reads a loop plugin RLCR session under `<worktree>/.loop/rlcr/<session>/` and
 * derives a native monitor snapshot — the same files the CLI `loop monitor
 * rlcr` follows. Refreshes on a 2s poll plus `.loop` fs:events (state-file
 * renames don't always emit precise events, so the poll is the safety net).
 *
 * Session selection, in priority order:
 *   1. `sessionDirOverride` — read that exact directory (pinned run / history).
 *   2. Otherwise scan `.loop/rlcr`, drop any `preStartSessions`, and prefer the
 *      candidate whose `state.md` `plan_file` matches `planRelPath` (newest as
 *      fallback). Returns null while no fresh session exists yet, so the UI
 *      shows "starting…" instead of a stale completed loop.
 */
export function useLoopStatus({
	workspaceId,
	worktreePath,
	enabled,
	planRelPath,
	preStartSessions,
	sessionDirOverride,
}: UseLoopStatusOptions): UseLoopStatusResult {
	const utils = workspaceTrpc.useUtils();
	const rlcrDir = worktreePath ? joinPath(worktreePath, ".loop/rlcr") : "";
	const active = enabled && !!rlcrDir && !!workspaceId;
	const preStartKey = (preStartSessions ?? []).join(",");

	const readText = async (absolutePath: string): Promise<string | null> => {
		try {
			const result = await utils.filesystem.readFile.fetch({
				workspaceId,
				absolutePath,
				encoding: "utf-8",
				maxBytes: MAX_ROUND_BYTES,
			});
			return result.kind === "text" ? result.content : null;
		} catch {
			return null;
		}
	};

	// Read a single session directory into a full monitor snapshot.
	const readSession = async (
		absolutePath: string,
		name: string,
	): Promise<LoopRlcrStatus | null> => {
		let fileNames: string[];
		try {
			const listing = await utils.filesystem.listDirectory.fetch({
				workspaceId,
				absolutePath,
			});
			fileNames = listing.entries.map((e) => e.name);
		} catch {
			return null;
		}

		const { status, stateFileName } = detectStatusFromFiles(fileNames);
		const fields = stateFileName
			? parseStateFields(
					(await readText(joinPath(absolutePath, stateFileName))) ?? "",
				)
			: parseStateFields("");

		const goalMd = await readText(joinPath(absolutePath, "goal-tracker.md"));
		const goal = goalMd
			? parseGoalTracker(goalMd)
			: {
					goal: null,
					acs: [] as AcItem[],
					acsTotal: 0,
					acsCompleted: 0,
					tasks: [],
					tasksActive: 0,
					tasksCompleted: 0,
					tasksDeferred: 0,
					openIssues: 0,
				};

		// Split Build vs Reviewing inside the Implementation Phase by checking
		// whether the current round's summary has real (non-scaffold) content.
		let currentRoundSummaryFilled = false;
		if (status === "active" && fields.currentRound != null) {
			const summaryMd = await readText(
				joinPath(absolutePath, `round-${fields.currentRound}-summary.md`),
			);
			currentRoundSummaryFilled = summaryMd
				? isRoundSummaryFilled(summaryMd)
				: false;
		}

		const latestRoundName = findLatestRoundFile(fileNames);
		const latestRoundText = latestRoundName
			? await readText(joinPath(absolutePath, latestRoundName))
			: null;

		return {
			sessionDir: absolutePath,
			sessionName: name,
			status,
			phaseLabel: derivePhaseLabel(
				status,
				fields,
				fileNames.includes(".review-phase-started"),
				currentRoundSummaryFilled,
			),
			isTerminal: isTerminalLoopStatus(status),
			currentRound: fields.currentRound,
			maxIterations: fields.maxIterations,
			reviewStarted: fields.reviewStarted,
			codexModel: fields.codexModel,
			codexEffort: fields.codexEffort,
			startedAt: fields.startedAt,
			planFile: fields.planFile,
			claudeSessionId: fields.sessionId,
			driftStatus: fields.driftStatus,
			mainlineStallCount: fields.mainlineStallCount,
			goal: goal.goal,
			tasks: goal.tasks,
			acs: goal.acs,
			acsTotal: goal.acsTotal,
			acsCompleted: goal.acsCompleted,
			tasksActive: goal.tasksActive,
			tasksCompleted: goal.tasksCompleted,
			tasksDeferred: goal.tasksDeferred,
			openIssues: goal.openIssues,
			latestRoundLabel: latestRoundName,
			latestRoundText,
		};
	};

	const query = useQuery<LoopRlcrStatus | null>({
		queryKey: [
			"loop-rlcr-status",
			workspaceId,
			rlcrDir,
			sessionDirOverride ?? "",
			planRelPath ?? "",
			preStartKey,
		],
		enabled: active,
		refetchInterval: active ? 2000 : false,
		queryFn: async () => {
			// Pinned session (running run adopted it, or history view) — read directly.
			if (sessionDirOverride) {
				return readSession(sessionDirOverride, basename(sessionDirOverride));
			}

			let sessionEntries: { absolutePath: string; name: string }[];
			try {
				const listing = await utils.filesystem.listDirectory.fetch({
					workspaceId,
					absolutePath: rlcrDir,
				});
				sessionEntries = listing.entries
					.filter((e) => e.kind === "directory" && SESSION_NAME_RE.test(e.name))
					.map((e) => ({ absolutePath: e.absolutePath, name: e.name }));
			} catch {
				return null;
			}

			const excluded = new Set(preStartSessions ?? []);
			const candidates = sessionEntries
				.filter((e) => !excluded.has(e.name))
				.sort((a, b) => (a.name < b.name ? 1 : -1)); // newest first
			if (candidates.length === 0) return null;

			// Newest candidate is normally our run; correlate by plan_file when we
			// know it, otherwise take the newest readable candidate.
			let fallback: LoopRlcrStatus | null = null;
			for (const candidate of candidates) {
				const snapshot = await readSession(
					candidate.absolutePath,
					candidate.name,
				);
				if (!snapshot) continue;
				if (fallback === null) fallback = snapshot;
				if (!planRelPath) return snapshot;
				if (snapshot.planFile === planRelPath) return snapshot;
			}
			return fallback;
		},
	});

	useWorkspaceEvent(
		"fs:events",
		workspaceId,
		(event) => {
			if (event.absolutePath.includes("/.loop/")) {
				void query.refetch();
			}
		},
		active,
	);

	return {
		status: query.data ?? null,
		isLoading: query.isLoading,
		refetch: () => {
			void query.refetch();
		},
	};
}
