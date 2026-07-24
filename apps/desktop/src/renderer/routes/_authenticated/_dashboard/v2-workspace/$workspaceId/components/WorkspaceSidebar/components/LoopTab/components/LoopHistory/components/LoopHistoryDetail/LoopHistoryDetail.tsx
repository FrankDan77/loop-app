import { Badge } from "@superset/ui/badge";
import { Button } from "@superset/ui/button";
import { Spinner } from "@superset/ui/spinner";
import { LuArrowLeft, LuPlay, LuRotateCw } from "react-icons/lu";
import type { LoopSessionState } from "renderer/routes/_authenticated/providers/CollectionsProvider/dashboardSidebarLocal";
import {
	isResumableTerminalStatus,
	type LoopRunStatus,
	useLoopStatus,
} from "../../../../../../hooks/useLoopStatus";
import { LoopMonitor } from "../../../LoopMonitor";

/** Args for resuming a terminated-but-resumable session from history. */
export interface LoopResumeArgs {
	sessionDir: string;
	reason: LoopRunStatus;
	planRelPath: string | null;
	claudeSessionId: string | null;
}

interface LoopHistoryDetailProps {
	workspaceId: string;
	worktreePath: string;
	/** Absolute path of the `.loop/rlcr/<session>` directory to display. */
	sessionDir: string;
	loopState: LoopSessionState;
	onBack: () => void;
	/** Adopt this active session into the panel + return to live controls. */
	onAdopt: (sessionDir: string, planFile: string | null) => void;
	/** Return to the live controls panel (this is already the tracked loop). */
	onReturnToLive: () => void;
	/** Restore + reattach a terminated-but-resumable (stop/cancel/maxiter/…) run. */
	onResume: (args: LoopResumeArgs) => void;
}

/**
 * Monitor snapshot of a single RLCR session. `complete` sessions are read-only.
 * An active (non-terminal) session offers "Return to controls" (already the
 * tracked loop) or "Take over this loop" (adopt). A terminated-but-resumable
 * session (stop/cancel/maxiter/unexpected) offers "Resume this loop", which
 * restores the plugin state file and reattaches the loop's Claude session.
 */
export function LoopHistoryDetail({
	workspaceId,
	worktreePath,
	sessionDir,
	loopState,
	onBack,
	onAdopt,
	onReturnToLive,
	onResume,
}: LoopHistoryDetailProps) {
	const { status, isLoading } = useLoopStatus({
		workspaceId,
		worktreePath,
		enabled: true,
		sessionDirOverride: sessionDir,
	});

	const isActive = status != null && !status.isTerminal;
	const isResumableTerminal =
		status?.isTerminal && isResumableTerminalStatus(status.status);
	const isTrackedLive =
		loopState.phase === "rlcrRunning" &&
		loopState.sessionDir === sessionDir &&
		!!loopState.terminalId;

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
			<div className="flex items-center justify-between gap-2">
				<Button
					variant="ghost"
					size="sm"
					className="h-7 gap-1.5 text-xs"
					onClick={onBack}
				>
					<LuArrowLeft className="size-3.5" />
					Back
				</Button>
				{isActive ? (
					isTrackedLive ? (
						<Button
							size="sm"
							className="h-7 gap-1.5 text-xs"
							onClick={onReturnToLive}
						>
							<LuPlay className="size-3.5" />
							Return to controls
						</Button>
					) : (
						<Button
							size="sm"
							className="h-7 gap-1.5 text-xs"
							onClick={() => onAdopt(sessionDir, status?.planFile ?? null)}
						>
							<LuPlay className="size-3.5" />
							Take over this loop
						</Button>
					)
				) : isResumableTerminal && status ? (
					<Button
						size="sm"
						className="h-7 gap-1.5 text-xs"
						onClick={() =>
							onResume({
								sessionDir,
								reason: status.status,
								planRelPath: status.planFile,
								claudeSessionId: status.claudeSessionId,
							})
						}
					>
						<LuRotateCw className="size-3.5" />
						Resume this loop
					</Button>
				) : (
					<Badge variant="secondary" className="text-[10px]">
						Read-only
					</Badge>
				)}
			</div>

			{status ? (
				<LoopMonitor status={status} />
			) : isLoading ? (
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Spinner className="size-4" />
					Loading session…
				</div>
			) : (
				<div className="text-sm text-muted-foreground">
					This session could not be read.
				</div>
			)}
		</div>
	);
}
