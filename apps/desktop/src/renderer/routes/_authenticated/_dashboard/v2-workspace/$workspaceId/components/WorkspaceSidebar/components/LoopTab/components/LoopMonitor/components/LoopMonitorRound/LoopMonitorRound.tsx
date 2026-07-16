import { ScrollArea } from "@superset/ui/scroll-area";
import type { LoopRlcrStatus } from "../../../../../../hooks/useLoopStatus";

interface LoopMonitorRoundProps {
	status: LoopRlcrStatus;
}

/** Round subpanel: the latest round artifact (summary/review) as raw text. */
export function LoopMonitorRound({ status }: LoopMonitorRoundProps) {
	if (!status.latestRoundText) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-1 p-4 text-center">
				<p className="text-sm text-muted-foreground">No round output yet</p>
				<p className="text-[11px] text-muted-foreground">
					Each round's summary and review will appear here.
				</p>
			</div>
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
				{status.latestRoundLabel ?? "Latest round"}
			</div>
			<ScrollArea className="min-h-24 flex-1 rounded-md border border-border bg-muted/30">
				<pre className="whitespace-pre-wrap wrap-break-word p-2 font-mono text-[11px] leading-relaxed text-foreground">
					{status.latestRoundText}
				</pre>
			</ScrollArea>
		</div>
	);
}
