import { Badge } from "@superset/ui/badge";
import { ScrollArea } from "@superset/ui/scroll-area";
import type {
	LoopRlcrStatus,
	TaskItem,
} from "../../../../../../hooks/useLoopStatus";

interface LoopMonitorTasksProps {
	status: LoopRlcrStatus;
}

type StatusVariant = "default" | "secondary" | "destructive" | "outline";

/** Map the goal tracker's raw task status to a badge label + colour. */
function statusMeta(raw: string): { label: string; variant: StatusVariant } {
	switch (raw) {
		case "completed":
		case "verified":
		case "done":
			return { label: "Completed", variant: "default" };
		case "in_progress":
		case "analyze":
		case "partial":
		case "todo":
			return {
				label: raw === "analyze" ? "Analyze" : "In progress",
				variant: "secondary",
			};
		case "blocked":
			return { label: "Blocked", variant: "destructive" };
		case "skipped":
		case "deferred":
		case "cancelled":
			return {
				label: raw.charAt(0).toUpperCase() + raw.slice(1),
				variant: "outline",
			};
		case "pending":
		case "":
			return { label: "Pending", variant: "outline" };
		default:
			return {
				label: raw.charAt(0).toUpperCase() + raw.slice(1),
				variant: "outline",
			};
	}
}

/**
 * Tasks subpanel: one row per Active Task from the goal tracker — the task
 * text, the acceptance criteria it targets, and its live per-task status.
 * More accurate than reverse-deriving AC status, since `completed`/`skipped`/
 * `analyze` tasks stay in Active Tasks until Codex verifies them.
 */
export function LoopMonitorTasks({ status }: LoopMonitorTasksProps) {
	const tasks = status.tasks;

	if (tasks.length === 0) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-1 p-4 text-center">
				<p className="text-sm text-muted-foreground">No active tasks yet</p>
				<p className="text-[11px] text-muted-foreground">
					Tasks are initialized by Claude in Round 0.
				</p>
			</div>
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-2">
			<div className="flex items-baseline justify-between text-xs">
				<span className="text-muted-foreground">Active tasks</span>
				<span className="font-medium text-foreground">{tasks.length}</span>
			</div>
			<ScrollArea className="min-h-0 flex-1">
				<ul className="flex flex-col gap-1.5 pr-2">
					{tasks.map((task, index) => (
						<TaskRow key={`${task.task}-${index}`} task={task} />
					))}
				</ul>
			</ScrollArea>
		</div>
	);
}

function TaskRow({ task }: { task: TaskItem }) {
	const meta = statusMeta(task.status);
	return (
		<li className="rounded-md border border-border bg-card p-2">
			<div className="flex flex-col gap-1.5">
				<div className="flex flex-wrap items-center gap-1.5">
					<Badge variant={meta.variant} className="text-[10px]">
						{meta.label}
					</Badge>
					{task.targetAcs.map((ac) => (
						<Badge key={ac} variant="outline" className="text-[10px] font-mono">
							{ac}
						</Badge>
					))}
				</div>
				<span className="text-xs text-foreground">{task.task}</span>
				{task.notes ? (
					<span className="text-[11px] text-muted-foreground">
						{task.notes}
					</span>
				) : null}
			</div>
		</li>
	);
}
