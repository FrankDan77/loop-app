import { Badge } from "@superset/ui/badge";
import { Button } from "@superset/ui/button";
import { Spinner } from "@superset/ui/spinner";
import { LuCircleCheck, LuOctagonX, LuPlug, LuRotateCcw } from "react-icons/lu";
import type { LoopSessionState } from "renderer/routes/_authenticated/providers/CollectionsProvider/dashboardSidebarLocal";
import type { LoopOrchestratorApi } from "../../../../hooks/useLoopOrchestrator";
import type { LoopRlcrStatus } from "../../../../hooks/useLoopStatus";
import { LoopControls } from "../LoopControls";
import { LoopIdeaForm } from "../LoopIdeaForm";
import { LoopMonitor } from "../LoopMonitor";
import { LoopPlanReview } from "../LoopPlanReview";
import { LoopStepper } from "../LoopStepper";

interface LoopPhaseViewProps {
	workspaceId: string;
	loopState: LoopSessionState;
	status: LoopRlcrStatus | null;
	orchestrator: LoopOrchestratorApi;
	initialIdea?: string;
}

function rlcrStepIndex(status: LoopRlcrStatus | null): number {
	switch (status?.phaseLabel) {
		case "Review":
			return 3;
		case "Finalize":
			return 4;
		default:
			return 2;
	}
}

/**
 * The active Loop workflow, rendering one view per phase of the half-automatic
 * gen-idea → gen-plan → planReview → rlcrRunning → done/ended flow.
 */
export function LoopPhaseView({
	workspaceId,
	loopState,
	status,
	orchestrator,
	initialIdea,
}: LoopPhaseViewProps) {
	const { phase } = loopState;

	if (phase === "idle") {
		return (
			<LoopIdeaForm
				initialIdea={initialIdea}
				isSubmitting={orchestrator.isSending}
				onSubmit={(idea) => void orchestrator.startFromIdea(idea)}
			/>
		);
	}

	if (phase === "genIdea" || phase === "genPlan") {
		const label =
			phase === "genIdea"
				? "Drafting the idea…"
				: "Generating the plan (discussion mode)…";
		return (
			<div className="flex min-h-0 flex-1 flex-col gap-4 p-3">
				<LoopStepper
					activeIndex={phase === "genIdea" ? 0 : 1}
					state="running"
				/>
				<div className="flex items-center gap-2 text-sm text-foreground">
					<Spinner className="size-4 text-primary" />
					{label}
				</div>
				<p className="text-xs text-muted-foreground">
					Follow along in the central Loop terminal. This continues
					automatically to the next step.
				</p>
				<Button
					variant="ghost"
					size="sm"
					className="w-fit gap-1.5"
					onClick={orchestrator.reset}
				>
					<LuRotateCcw className="size-3.5" />
					Cancel
				</Button>
			</div>
		);
	}

	if (phase === "planReview" && loopState.planPath && loopState.planRelPath) {
		return (
			<LoopPlanReview
				workspaceId={workspaceId}
				planPath={loopState.planPath}
				planRelPath={loopState.planRelPath}
				isSending={orchestrator.isSending}
				onStart={() => void orchestrator.startRlcr()}
				onRefine={() => void orchestrator.refinePlan()}
				onReset={orchestrator.reset}
			/>
		);
	}

	if (phase === "done" || phase === "ended") {
		const isDone = phase === "done";
		return (
			<div className="flex min-h-0 flex-1 flex-col gap-4 p-3">
				<div className="flex items-center gap-2">
					{isDone ? (
						<LuCircleCheck className="size-5 text-primary" />
					) : (
						<LuOctagonX className="size-5 text-destructive" />
					)}
					<span className="text-sm font-medium text-foreground">
						{isDone ? "Loop complete" : "Loop ended"}
					</span>
					{status ? (
						<Badge
							variant={isDone ? "default" : "destructive"}
							className="text-[10px] capitalize"
						>
							{status.status}
						</Badge>
					) : null}
				</div>
				<LoopStepper
					activeIndex={isDone ? 5 : rlcrStepIndex(status)}
					state={isDone ? "done" : "error"}
				/>
				{status ? <LoopMonitor status={status} /> : null}
				<Button className="w-full gap-2" onClick={orchestrator.reset}>
					<LuRotateCcw className="size-4" />
					Start a new Loop
				</Button>
			</div>
		);
	}

	// rlcrRunning
	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3">
			<LoopStepper activeIndex={rlcrStepIndex(status)} state="running" />
			{status ? (
				<LoopMonitor status={status} />
			) : (
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Spinner className="size-4" />
					Starting the RLCR loop…
				</div>
			)}
			{loopState.terminalId ? (
				<div className="flex flex-col gap-2">
					<LoopControls
						disabled={orchestrator.isSending}
						onStop={() => void orchestrator.stop()}
						onRetry={() => void orchestrator.retry()}
						onInterrupt={() => void orchestrator.interrupt()}
						onResume={() => void orchestrator.resume()}
					/>
					{status?.claudeSessionId ? (
						<div className="flex flex-col gap-1 border-t border-border pt-2">
							<Button
								variant="ghost"
								size="sm"
								className="w-fit gap-1.5 text-xs"
								disabled={orchestrator.isSending}
								onClick={() => void orchestrator.reattach()}
							>
								<LuPlug className="size-3.5" />
								Claude exited? Re-enter session
							</Button>
							<p className="text-[11px] text-muted-foreground">
								If the buttons above land in the shell (e.g.{" "}
								<code>command not found</code>), Claude has exited. This resumes
								the loop's session (<code>claude --resume</code>) in a new
								terminal and auto-sends “continue” to restart the loop.
							</p>
						</div>
					) : null}
				</div>
			) : (
				<div className="flex flex-col gap-2">
					<Button
						className="w-full gap-2"
						disabled={orchestrator.isSending}
						onClick={() => void orchestrator.reattach()}
					>
						<LuPlug className="size-4" />
						Reattach terminal to control this loop
					</Button>
					<p className="text-[11px] text-muted-foreground">
						No live Loop terminal is attached. Reattaching resumes this loop's
						Claude session (<code>claude --resume</code>) and auto-sends
						“continue” so the run picks back up.
					</p>
				</div>
			)}
		</div>
	);
}
