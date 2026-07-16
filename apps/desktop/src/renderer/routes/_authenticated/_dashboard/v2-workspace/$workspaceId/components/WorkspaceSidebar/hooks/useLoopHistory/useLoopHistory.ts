import { workspaceTrpc } from "@superset/workspace-client";
import { useQuery } from "@tanstack/react-query";
import { useWorkspaceEvent } from "renderer/hooks/host-service/useWorkspaceEvent";
import {
	derivePhaseLabel,
	detectStatusFromFiles,
	isTerminalLoopStatus,
	type LoopRunStatus,
	parseGoalTracker,
	parseStateFields,
} from "../useLoopStatus/parseLoopStatus";

const SESSION_NAME_RE = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/;
const MAX_STATE_BYTES = 20_000;

/** Lightweight per-session summary for the history list. */
export interface LoopHistoryEntry {
	sessionDir: string;
	sessionName: string;
	status: LoopRunStatus;
	phaseLabel: string;
	isTerminal: boolean;
	goal: string | null;
	currentRound: number | null;
	maxIterations: number | null;
	startedAt: string | null;
}

function joinPath(...parts: string[]): string {
	return parts
		.map((p, i) => (i === 0 ? p.replace(/\/$/, "") : p.replace(/^\/|\/$/g, "")))
		.filter((p) => p.length > 0)
		.join("/");
}

interface UseLoopHistoryOptions {
	workspaceId: string;
	worktreePath: string;
	enabled: boolean;
}

interface UseLoopHistoryResult {
	entries: LoopHistoryEntry[];
	isLoading: boolean;
	refetch: () => void;
}

/**
 * Lists every RLCR session under `<worktree>/.loop/rlcr/` (newest first) with a
 * lightweight summary derived from each session's state + goal-tracker files.
 * Only fetches while the history panel is open to avoid steady-state IO.
 */
export function useLoopHistory({
	workspaceId,
	worktreePath,
	enabled,
}: UseLoopHistoryOptions): UseLoopHistoryResult {
	const utils = workspaceTrpc.useUtils();
	const rlcrDir = worktreePath ? joinPath(worktreePath, ".loop/rlcr") : "";
	const active = enabled && !!rlcrDir && !!workspaceId;

	const readText = async (absolutePath: string): Promise<string | null> => {
		try {
			const result = await utils.filesystem.readFile.fetch({
				workspaceId,
				absolutePath,
				encoding: "utf-8",
				maxBytes: MAX_STATE_BYTES,
			});
			return result.kind === "text" ? result.content : null;
		} catch {
			return null;
		}
	};

	const query = useQuery<LoopHistoryEntry[]>({
		queryKey: ["loop-rlcr-history", workspaceId, rlcrDir],
		enabled: active,
		refetchInterval: active ? 4000 : false,
		queryFn: async () => {
			let sessions: { absolutePath: string; name: string }[];
			try {
				const listing = await utils.filesystem.listDirectory.fetch({
					workspaceId,
					absolutePath: rlcrDir,
				});
				sessions = listing.entries
					.filter((e) => e.kind === "directory" && SESSION_NAME_RE.test(e.name))
					.map((e) => ({ absolutePath: e.absolutePath, name: e.name }))
					.sort((a, b) => (a.name < b.name ? 1 : -1)); // newest first
			} catch {
				return [];
			}

			const entries = await Promise.all(
				sessions.map(async ({ absolutePath, name }) => {
					let fileNames: string[] = [];
					try {
						const listing = await utils.filesystem.listDirectory.fetch({
							workspaceId,
							absolutePath,
						});
						fileNames = listing.entries.map((e) => e.name);
					} catch {
						// Directory vanished mid-scan — fall through with empty state.
					}

					const { status, stateFileName } = detectStatusFromFiles(fileNames);
					const fields = stateFileName
						? parseStateFields(
								(await readText(joinPath(absolutePath, stateFileName))) ?? "",
							)
						: parseStateFields("");
					const goalMd = await readText(
						joinPath(absolutePath, "goal-tracker.md"),
					);
					const goal = goalMd ? parseGoalTracker(goalMd).goal : null;

					return {
						sessionDir: absolutePath,
						sessionName: name,
						status,
						phaseLabel: derivePhaseLabel(
							status,
							fields,
							fileNames.includes(".review-phase-started"),
						),
						isTerminal: isTerminalLoopStatus(status),
						goal,
						currentRound: fields.currentRound,
						maxIterations: fields.maxIterations,
						startedAt: fields.startedAt,
					} satisfies LoopHistoryEntry;
				}),
			);
			return entries;
		},
	});

	useWorkspaceEvent(
		"fs:events",
		workspaceId,
		(event) => {
			if (event.absolutePath.includes("/.loop/rlcr/")) {
				void query.refetch();
			}
		},
		active,
	);

	return {
		entries: query.data ?? [],
		isLoading: query.isLoading,
		refetch: () => {
			void query.refetch();
		},
	};
}
