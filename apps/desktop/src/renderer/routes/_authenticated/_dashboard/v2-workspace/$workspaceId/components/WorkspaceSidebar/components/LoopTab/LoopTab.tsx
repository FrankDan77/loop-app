import { Button } from "@superset/ui/button";
import { useState } from "react";
import { LuHistory } from "react-icons/lu";
import type { LoopSessionState } from "renderer/routes/_authenticated/providers/CollectionsProvider/dashboardSidebarLocal";
import type { LoopOrchestratorApi } from "../../hooks/useLoopOrchestrator";
import type { LoopRlcrStatus } from "../../hooks/useLoopStatus";
import { LoopHistory } from "./components/LoopHistory";
import { LoopPhaseView } from "./components/LoopPhaseView";

interface LoopTabProps {
	workspaceId: string;
	worktreePath: string;
	loopState: LoopSessionState;
	status: LoopRlcrStatus | null;
	orchestrator: LoopOrchestratorApi;
	initialIdea?: string;
}

/**
 * Workspace-scoped Loop sidebar. Shows the active half-automatic workflow (one
 * view per phase) while the loop Claude session runs in the central terminal.
 * A persistent header toggles a read-only history view of past RLCR sessions.
 */
export function LoopTab({
	workspaceId,
	worktreePath,
	loopState,
	status,
	orchestrator,
	initialIdea,
}: LoopTabProps) {
	const [historyOpen, setHistoryOpen] = useState(false);

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="flex items-center justify-between border-b border-border px-3 py-2">
				<span className="text-xs font-medium text-foreground">Loop</span>
				<Button
					variant={historyOpen ? "secondary" : "ghost"}
					size="sm"
					className="h-7 gap-1.5 text-xs"
					onClick={() => setHistoryOpen((open) => !open)}
				>
					<LuHistory className="size-3.5" />
					{historyOpen ? "Close" : "History"}
				</Button>
			</div>
			{historyOpen ? (
				<LoopHistory
					workspaceId={workspaceId}
					worktreePath={worktreePath}
					loopState={loopState}
					onAdopt={(sessionDir, planFile) => {
						orchestrator.adopt(sessionDir, planFile);
						setHistoryOpen(false);
					}}
					onReturnToLive={() => setHistoryOpen(false)}
				/>
			) : (
				<LoopPhaseView
					workspaceId={workspaceId}
					loopState={loopState}
					status={status}
					orchestrator={orchestrator}
					initialIdea={initialIdea}
				/>
			)}
		</div>
	);
}
