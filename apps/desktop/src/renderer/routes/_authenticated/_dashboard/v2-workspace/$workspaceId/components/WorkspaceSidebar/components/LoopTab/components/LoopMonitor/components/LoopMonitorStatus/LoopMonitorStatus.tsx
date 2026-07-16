import { Badge } from "@superset/ui/badge";
import { Progress } from "@superset/ui/progress";
import type { LoopRlcrStatus } from "../../../../../../hooks/useLoopStatus";

interface LoopMonitorStatusProps {
	status: LoopRlcrStatus;
}

function StatRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-baseline justify-between gap-2 text-xs">
			<span className="text-muted-foreground">{label}</span>
			<span className="truncate text-right font-medium text-foreground">
				{value}
			</span>
		</div>
	);
}

function TaskStat({
	label,
	value,
	accent,
}: {
	label: string;
	value: number;
	accent?: boolean;
}) {
	return (
		<div className="rounded-md border border-border bg-muted/30 p-1.5">
			<div
				className={
					accent
						? "text-sm font-semibold text-destructive"
						: "text-sm font-semibold text-foreground"
				}
			>
				{value}
			</div>
			<div className="text-[10px] text-muted-foreground">{label}</div>
		</div>
	);
}

/** Overview subpanel: goal, phase/round/model/drift, AC progress, task tallies. */
export function LoopMonitorStatus({ status }: LoopMonitorStatusProps) {
	const acPct =
		status.acsTotal > 0
			? Math.round((status.acsCompleted / status.acsTotal) * 100)
			: 0;
	const roundText =
		status.currentRound != null
			? `${status.currentRound}${status.maxIterations != null ? ` / ${status.maxIterations}` : ""}`
			: "—";
	const model =
		status.codexModel != null
			? `${status.codexModel}${status.codexEffort ? ` (${status.codexEffort})` : ""}`
			: "—";
	const driftAbnormal =
		status.driftStatus != null && status.driftStatus !== "normal";

	return (
		<div className="flex flex-col gap-3">
			{status.goal ? (
				<div className="rounded-md border border-border bg-muted/40 p-2">
					<div className="text-[10px] uppercase tracking-wide text-muted-foreground">
						Ultimate goal
					</div>
					<div className="mt-0.5 text-xs text-foreground">{status.goal}</div>
				</div>
			) : null}

			<div className="flex flex-col gap-1.5">
				<StatRow label="Phase" value={status.phaseLabel} />
				<StatRow label="Round" value={roundText} />
				<StatRow label="Model" value={model} />
				{driftAbnormal ? (
					<div className="flex items-center justify-between gap-2 text-xs">
						<span className="text-muted-foreground">Drift</span>
						<Badge variant="destructive" className="text-[10px]">
							{status.driftStatus}
							{status.mainlineStallCount
								? ` (${status.mainlineStallCount})`
								: ""}
						</Badge>
					</div>
				) : null}
			</div>

			<div className="flex flex-col gap-1">
				<div className="flex items-baseline justify-between text-xs">
					<span className="text-muted-foreground">Acceptance criteria</span>
					<span className="font-medium text-foreground">
						{status.acsCompleted}/{status.acsTotal}
					</span>
				</div>
				<Progress value={acPct} />
			</div>

			<div className="grid grid-cols-3 gap-2 text-center">
				<TaskStat label="Active" value={status.tasksActive} />
				<TaskStat label="Done" value={status.tasksCompleted} />
				<TaskStat
					label="Issues"
					value={status.openIssues}
					accent={status.openIssues > 0}
				/>
			</div>
		</div>
	);
}
