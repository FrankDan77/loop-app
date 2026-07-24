import { Badge } from "@superset/ui/badge";
import { ScrollArea } from "@superset/ui/scroll-area";
import { Spinner } from "@superset/ui/spinner";
import { cn } from "@superset/ui/utils";
import { useState } from "react";
import { LuChevronRight, LuHistory } from "react-icons/lu";
import type { LoopSessionState } from "renderer/routes/_authenticated/providers/CollectionsProvider/dashboardSidebarLocal";
import {
	type LoopHistoryEntry,
	useLoopHistory,
} from "../../../../hooks/useLoopHistory";
import {
	LoopHistoryDetail,
	type LoopResumeArgs,
} from "./components/LoopHistoryDetail";

interface LoopHistoryProps {
	workspaceId: string;
	worktreePath: string;
	loopState: LoopSessionState;
	/** Adopt an active session into the panel + return to live controls. */
	onAdopt: (sessionDir: string, planFile: string | null) => void;
	/** Return to the live controls panel (already the tracked loop). */
	onReturnToLive: () => void;
	/** Restore + reattach a terminated-but-resumable run from history. */
	onResume: (args: LoopResumeArgs) => void;
}

function statusVariant(
	entry: LoopHistoryEntry,
): "default" | "secondary" | "destructive" {
	if (entry.status === "complete") return "default";
	if (!entry.isTerminal) return "secondary";
	return "destructive";
}

/** Prettify a `YYYY-MM-DD_HH-MM-SS` session name for the list. */
function formatSessionName(name: string): string {
	const match = name.match(/^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})$/);
	if (!match) return name;
	const [, y, mo, d, h, mi] = match;
	return `${y}-${mo}-${d} ${h}:${mi}`;
}

/**
 * Read-only history of past RLCR sessions for this worktree. Lists every
 * `.loop/rlcr/<session>` newest-first; selecting one opens its monitor snapshot
 * (no controls — historical runs are not resumable).
 */
export function LoopHistory({
	workspaceId,
	worktreePath,
	loopState,
	onAdopt,
	onReturnToLive,
	onResume,
}: LoopHistoryProps) {
	const [selectedDir, setSelectedDir] = useState<string | null>(null);
	const { entries, isLoading } = useLoopHistory({
		workspaceId,
		worktreePath,
		enabled: true,
	});

	if (selectedDir) {
		return (
			<LoopHistoryDetail
				workspaceId={workspaceId}
				worktreePath={worktreePath}
				sessionDir={selectedDir}
				loopState={loopState}
				onBack={() => setSelectedDir(null)}
				onAdopt={onAdopt}
				onReturnToLive={onReturnToLive}
				onResume={onResume}
			/>
		);
	}

	if (isLoading && entries.length === 0) {
		return (
			<div className="flex flex-1 items-center justify-center gap-2 p-3 text-sm text-muted-foreground">
				<Spinner className="size-4" />
				Loading history…
			</div>
		);
	}

	if (entries.length === 0) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
				<LuHistory className="size-6 text-muted-foreground" />
				<p className="text-sm text-muted-foreground">No past loops yet</p>
				<p className="text-xs text-muted-foreground">
					Finished RLCR runs for this project will appear here.
				</p>
			</div>
		);
	}

	return (
		<ScrollArea className="min-h-0 flex-1">
			<ul className="flex flex-col gap-1.5 p-3">
				{entries.map((entry) => (
					<li key={entry.sessionDir}>
						<button
							type="button"
							onClick={() => setSelectedDir(entry.sessionDir)}
							className={cn(
								"flex w-full items-center gap-2 rounded-md border border-border bg-card p-2 text-left",
								"transition-colors hover:bg-accent",
							)}
						>
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								<div className="flex items-center gap-2">
									<Badge
										variant={statusVariant(entry)}
										className="text-[10px] capitalize"
									>
										{entry.status}
									</Badge>
									<span className="truncate text-xs text-muted-foreground">
										{formatSessionName(entry.sessionName)}
									</span>
								</div>
								<span className="truncate text-xs text-foreground">
									{entry.goal ?? entry.phaseLabel}
								</span>
								{entry.currentRound != null ? (
									<span className="text-[10px] text-muted-foreground">
										Round {entry.currentRound}
										{entry.maxIterations != null
											? ` / ${entry.maxIterations}`
											: ""}
										{!entry.isTerminal ? " · active" : ""}
									</span>
								) : null}
							</div>
							<LuChevronRight className="size-4 shrink-0 text-muted-foreground" />
						</button>
					</li>
				))}
			</ul>
		</ScrollArea>
	);
}
