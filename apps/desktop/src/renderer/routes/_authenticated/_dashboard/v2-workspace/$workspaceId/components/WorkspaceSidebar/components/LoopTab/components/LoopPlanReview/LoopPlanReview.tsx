import { Button } from "@superset/ui/button";
import { ScrollArea } from "@superset/ui/scroll-area";
import { workspaceTrpc } from "@superset/workspace-client";
import { LuPlay, LuRotateCcw, LuWandSparkles } from "react-icons/lu";

interface LoopPlanReviewProps {
	workspaceId: string;
	planPath: string;
	planRelPath: string;
	isSending: boolean;
	onStart: () => void;
	onRefine: () => void;
	onReset: () => void;
}

/**
 * planReview phase: the auto flow paused after gen-plan so the user can read
 * the plan and decide. Confirming starts the RLCR loop; Refine folds in
 * reviewer comments; Discard returns to the idle form.
 */
export function LoopPlanReview({
	workspaceId,
	planPath,
	planRelPath,
	isSending,
	onStart,
	onRefine,
	onReset,
}: LoopPlanReviewProps) {
	const planQuery = workspaceTrpc.filesystem.readFile.useQuery(
		{
			workspaceId,
			absolutePath: planPath,
			encoding: "utf-8",
			maxBytes: 200_000,
		},
		{ refetchInterval: 3000 },
	);
	const planText =
		planQuery.data?.kind === "text" ? planQuery.data.content : null;

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
			<div>
				<div className="text-sm font-medium text-foreground">Review plan</div>
				<div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
					{planRelPath}
				</div>
			</div>

			<ScrollArea className="min-h-32 flex-1 rounded-md border border-border bg-muted/30">
				<pre className="whitespace-pre-wrap break-words p-2 font-mono text-[11px] leading-relaxed text-foreground">
					{planText ?? "Waiting for the plan…"}
				</pre>
			</ScrollArea>

			<div className="flex flex-col gap-2">
				<Button className="w-full gap-2" disabled={isSending} onClick={onStart}>
					<LuPlay className="size-4" />
					Start RLCR
				</Button>
				<div className="grid grid-cols-2 gap-2">
					<Button
						variant="outline"
						size="sm"
						className="gap-1.5"
						disabled={isSending}
						onClick={onRefine}
					>
						<LuWandSparkles className="size-3.5" />
						Refine
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="gap-1.5"
						onClick={onReset}
					>
						<LuRotateCcw className="size-3.5" />
						Discard
					</Button>
				</div>
			</div>
		</div>
	);
}
