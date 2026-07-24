import { Tabs, TabsContent, TabsList, TabsTrigger } from "@superset/ui/tabs";
import { useState } from "react";
import type { LoopRlcrStatus } from "../../../../hooks/useLoopStatus";
import { LoopMonitorProgress } from "./components/LoopMonitorProgress";
import { LoopMonitorRound } from "./components/LoopMonitorRound";
import { LoopMonitorStatus } from "./components/LoopMonitorStatus";

interface LoopMonitorProps {
	status: LoopRlcrStatus;
}

type MonitorTab = "status" | "progress" | "round";

/**
 * Native render of the loop plugin's RLCR monitor. The denser goal/progress/
 * round data is split across switchable subpanels so it fits the sidebar:
 *   - Status: goal, phase/round/model/drift, AC progress, task tallies.
 *   - Progress: each acceptance criterion and its live status.
 *   - Round: the latest round summary/review text.
 */
export function LoopMonitor({ status }: LoopMonitorProps) {
	const [tab, setTab] = useState<MonitorTab>("status");

	return (
		<Tabs
			value={tab}
			onValueChange={(value) => setTab(value as MonitorTab)}
			className="flex min-h-0 flex-1 flex-col gap-2"
		>
			<TabsList className="w-full">
				<TabsTrigger value="status">Status</TabsTrigger>
				<TabsTrigger value="progress">
					Progress
					{status.acsTotal > 0 ? (
						<span className="ml-1 text-[10px] text-muted-foreground">
							{status.acsCompleted}/{status.acsTotal}
						</span>
					) : null}
				</TabsTrigger>
				<TabsTrigger value="round">Round</TabsTrigger>
			</TabsList>
			<TabsContent value="status" className="min-h-0">
				<LoopMonitorStatus status={status} />
			</TabsContent>
			<TabsContent value="progress" className="flex min-h-0 flex-col">
				<LoopMonitorProgress status={status} />
			</TabsContent>
			<TabsContent value="round" className="flex min-h-0 flex-col">
				<LoopMonitorRound status={status} />
			</TabsContent>
		</Tabs>
	);
}
