import { useEffect, useRef } from "react";
import { LuRefreshCw } from "react-icons/lu";
import { useLoopPendingIdeasStore } from "renderer/stores/loop-pending-ideas";
import { LoopTab } from "../../components/LoopTab";
import type { SidebarTabDefinition } from "../../types";
import {
	type CreateLoopTerminal,
	useLoopOrchestrator,
} from "../useLoopOrchestrator";
import { useLoopSession } from "../useLoopSession";
import { useLoopStatus } from "../useLoopStatus";

interface UseLoopTabOptions {
	workspaceId: string;
	worktreePath: string;
	onCreateLoopTerminal: CreateLoopTerminal;
	/** Focus the Loop tab (called when a modal-queued idea auto-starts). */
	onRequestFocus?: () => void;
}

/**
 * Assembles the Loop sidebar tab: owns the persisted state machine, the RLCR
 * file monitor, and the orchestrator (which runs even when the tab isn't
 * active, so auto-advance and monitoring continue in the background). Also
 * consumes any idea the new-workspace modal queued for this workspace.
 */
export function useLoopTab({
	workspaceId,
	worktreePath,
	onCreateLoopTerminal,
	onRequestFocus,
}: UseLoopTabOptions): SidebarTabDefinition {
	const { loopState, setLoopState } = useLoopSession(workspaceId);
	const monitorEnabled =
		loopState.phase === "rlcrRunning" ||
		loopState.phase === "done" ||
		loopState.phase === "ended";
	const { status } = useLoopStatus({
		workspaceId,
		worktreePath,
		enabled: monitorEnabled,
		planRelPath: loopState.planRelPath,
		preStartSessions: loopState.preStartSessions,
		sessionDirOverride: loopState.sessionDir,
	});
	const orchestrator = useLoopOrchestrator({
		workspaceId,
		worktreePath,
		loopState,
		setLoopState,
		status,
		onCreateLoopTerminal,
	});

	// Consume a modal-queued idea exactly once per workspace: auto-start the
	// flow when we land idle with a worktree ready. Guarded so switching
	// workspaces re-arms and an in-progress loop is never restarted.
	const takePendingIdea = useLoopPendingIdeasStore((s) => s.take);
	const consumedForRef = useRef<string | null>(null);
	useEffect(() => {
		if (consumedForRef.current === workspaceId) return;
		if (loopState.phase !== "idle") {
			consumedForRef.current = workspaceId;
			return;
		}
		if (!worktreePath) return;
		const idea = takePendingIdea(workspaceId);
		consumedForRef.current = workspaceId;
		if (idea) {
			onRequestFocus?.();
			void orchestrator.startFromIdea(idea);
		}
	}, [
		workspaceId,
		worktreePath,
		loopState.phase,
		takePendingIdea,
		orchestrator,
		onRequestFocus,
	]);

	const badge =
		loopState.phase === "rlcrRunning" && status?.currentRound
			? status.currentRound
			: undefined;

	return {
		id: "loop",
		label: "Loop",
		icon: LuRefreshCw,
		badge,
		content: (
			<LoopTab
				workspaceId={workspaceId}
				worktreePath={worktreePath}
				loopState={loopState}
				status={status}
				orchestrator={orchestrator}
			/>
		),
	};
}
