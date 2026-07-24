import { Badge } from "@superset/ui/badge";
import { ScrollArea } from "@superset/ui/scroll-area";
import type {
	AcItem,
	AcStatus,
	LoopRlcrStatus,
} from "../../../../../../hooks/useLoopStatus";

interface LoopMonitorProgressProps {
	status: LoopRlcrStatus;
}

type StatusVariant = "default" | "secondary" | "outline";

/** Map an acceptance-criterion status to a badge label + colour. */
function statusMeta(status: AcStatus): {
	label: string;
	variant: StatusVariant;
} {
	switch (status) {
		case "finished":
			return { label: "Finished", variant: "default" };
		case "in_progress":
			return { label: "In progress", variant: "secondary" };
		default:
			return { label: "Pending", variant: "outline" };
	}
}

/**
 * Progress subpanel: one row per acceptance criterion from the goal tracker.
 * Status is cross-referenced from the two mutable tables — an AC in
 * `Completed and Verified` is Finished; otherwise a targeting task marked
 * `in_progress` makes it In progress, else Pending.
 */
export function LoopMonitorProgress({ status }: LoopMonitorProgressProps) {
	const acs = status.acs;

	if (acs.length === 0) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-1 p-4 text-center">
				<p className="text-sm text-muted-foreground">
					No acceptance criteria yet
				</p>
				<p className="text-[11px] text-muted-foreground">
					Defined by Claude in Round 0.
				</p>
			</div>
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-2">
			<div className="flex items-baseline justify-between text-xs">
				<span className="text-muted-foreground">Acceptance criteria</span>
				<span className="font-medium text-foreground">
					{status.acsCompleted}/{status.acsTotal}
				</span>
			</div>
			<ScrollArea className="min-h-0 flex-1">
				<ul className="flex flex-col gap-1.5 pr-2">
					{acs.map((ac) => (
						<AcRow key={ac.id} ac={ac} />
					))}
				</ul>
			</ScrollArea>
		</div>
	);
}

function AcRow({ ac }: { ac: AcItem }) {
	const meta = statusMeta(ac.status);
	return (
		<li className="rounded-md border border-border bg-card p-2">
			<div className="flex flex-col gap-1.5">
				<div className="flex flex-wrap items-center gap-1.5">
					<Badge variant="outline" className="text-[10px] font-mono">
						{ac.id}
					</Badge>
					<Badge variant={meta.variant} className="text-[10px]">
						{meta.label}
					</Badge>
					{ac.status === "finished" && ac.verifiedRound != null ? (
						<span className="text-[10px] text-muted-foreground">
							Verified round {ac.verifiedRound}
						</span>
					) : null}
				</div>
				<span className="text-xs text-foreground">{ac.text}</span>
				{ac.status === "finished" && ac.evidence ? (
					<span className="text-[11px] text-muted-foreground">
						{ac.evidence}
					</span>
				) : null}
				{ac.status === "in_progress" && ac.tasks.length > 0 ? (
					<span className="text-[11px] text-muted-foreground">
						{ac.tasks.join(", ")}
					</span>
				) : null}
			</div>
		</li>
	);
}
