import { Tabs, TabsContent, TabsList, TabsTrigger } from "@superset/ui/tabs";
import { useState } from "react";
import type { LoopRlcrStatus } from "../../../../hooks/useLoopStatus";
import { LoopMonitorRound } from "./components/LoopMonitorRound";
import { LoopMonitorStatus } from "./components/LoopMonitorStatus";
import { LoopMonitorTasks } from "./components/LoopMonitorTasks";

interface LoopMonitorProps {
	status: LoopRlcrStatus;
}

type MonitorTab = "status" | "tasks" | "round";

/**
 * Native render of the loop plugin's RLCR monitor. The denser goal/tasks/
 * round data is split across switchable subpanels so it fits the sidebar:
 *   - Status: goal, phase/round/model/drift, AC progress, task tallies.
 *   - Tasks: each active task, the AC it targets, and its live status.
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
				<TabsTrigger value="tasks">
					Tasks
					{status.tasks.length > 0 ? (
						<span className="ml-1 text-[10px] text-muted-foreground">
							{status.tasks.length}
						</span>
					) : null}
				</TabsTrigger>
				<TabsTrigger value="round">Round</TabsTrigger>
			</TabsList>
			<TabsContent value="status" className="min-h-0">
				<LoopMonitorStatus status={status} />
			</TabsContent>
			<TabsContent value="tasks" className="flex min-h-0 flex-col">
				<LoopMonitorTasks status={status} />
			</TabsContent>
			<TabsContent value="round" className="flex min-h-0 flex-col">
				<LoopMonitorRound status={status} />
			</TabsContent>
		</Tabs>
	);
}
