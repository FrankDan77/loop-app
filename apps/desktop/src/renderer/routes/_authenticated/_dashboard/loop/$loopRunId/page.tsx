import {
	buildLoopClaudeLaunchCommand,
	buildLoopMonitorCommand,
	buildRloopSlashCommand,
	LOOP_PHASE_DESCRIPTORS,
	type LoopPhase,
	quoteShellArg,
} from "@superset/shared/loop-commands";
import { Badge } from "@superset/ui/badge";
import { Button } from "@superset/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@superset/ui/card";
import { Input } from "@superset/ui/input";
import { Label } from "@superset/ui/label";
import { cn } from "@superset/ui/utils";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LuArrowLeft, LuCircleCheck } from "react-icons/lu";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { CommandBlock } from "../components/CommandBlock";
import { useLoopRunsStore } from "../stores/loop-runs";

export const Route = createFileRoute(
	"/_authenticated/_dashboard/loop/$loopRunId/",
)({
	component: LoopRunPage,
});

function LoopRunPage() {
	const { loopRunId } = Route.useParams();
	const navigate = useNavigate();
	const run = useLoopRunsStore((s) => s.runs[loopRunId]);
	const updateRun = useLoopRunsStore((s) => s.updateRun);

	const statusQuery = electronTrpc.settings.loopStatus.useQuery(undefined, {
		refetchOnWindowFocus: false,
	});
	const loopDir = statusQuery.data?.loopDir ?? null;

	if (!run) {
		return (
			<div className="flex h-full w-full flex-col items-center justify-center gap-3">
				<p className="text-sm text-muted-foreground">Loop not found.</p>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => navigate({ to: "/loop" })}
				>
					Back to Loop
				</Button>
			</div>
		);
	}

	const cdPrefix = run.targetDir
		? `cd ${quoteShellArg(run.targetDir)} && `
		: "";
	const launchCommand = loopDir
		? `${cdPrefix}${buildLoopClaudeLaunchCommand(loopDir)}`
		: null;
	const monitorCommand = loopDir
		? `${cdPrefix}${buildLoopMonitorCommand(loopDir, "rlcr")}`
		: null;

	const phaseCommand = (phase: LoopPhase): string => {
		switch (phase) {
			case "idea":
				return buildRloopSlashCommand("idea", { idea: run.requirement });
			case "plan":
				return buildRloopSlashCommand("plan", {
					input: run.ideaPath || "draft.md",
					output: run.planPath,
				});
			case "refine":
				return buildRloopSlashCommand("refine", { input: run.planPath });
			case "run":
				return buildRloopSlashCommand("run", { planFile: run.planPath });
		}
	};

	return (
		<div className="flex h-full w-full flex-1 flex-col overflow-hidden">
			<header className="flex h-11 shrink-0 items-center gap-3 border-b border-border px-4">
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label="Back"
					onClick={() => navigate({ to: "/loop" })}
				>
					<LuArrowLeft className="size-4" />
				</Button>
				<h1 className="truncate text-sm font-semibold tracking-tight">
					{run.name}
				</h1>
				<Badge variant="secondary" className="ml-1 shrink-0">
					{run.phase}
				</Badge>
			</header>

			<div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">1. Launch a Loop session</CardTitle>
						<CardDescription>
							Run this in a terminal (inside a Loop workspace) to start Claude
							Code with the loop plugin loaded. Slash commands below use the{" "}
							<code className="font-mono">/rloop:</code> prefix.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="loop-target">Target repo path</Label>
							<Input
								id="loop-target"
								value={run.targetDir}
								onChange={(e) =>
									updateRun(run.id, { targetDir: e.target.value })
								}
							/>
						</div>
						{launchCommand ? (
							<CommandBlock
								label="Start Claude with loop plugin"
								command={launchCommand}
							/>
						) : (
							<p className="text-sm text-muted-foreground">
								Bundled loop plugin not found in this build.
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm">2. Workflow phases</CardTitle>
						<CardDescription>
							Paste each command into the Loop Claude session, in order. Refine
							is optional. Mark the current phase to track progress.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="loop-idea-path">Idea/draft path</Label>
								<Input
									id="loop-idea-path"
									value={run.ideaPath}
									placeholder="draft.md"
									onChange={(e) =>
										updateRun(run.id, { ideaPath: e.target.value })
									}
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="loop-plan-path">Plan path</Label>
								<Input
									id="loop-plan-path"
									value={run.planPath}
									placeholder="docs/plan.md"
									onChange={(e) =>
										updateRun(run.id, { planPath: e.target.value })
									}
								/>
							</div>
						</div>

						{LOOP_PHASE_DESCRIPTORS.map((descriptor, index) => {
							const isCurrent = run.phase === descriptor.phase;
							return (
								<div
									key={descriptor.phase}
									className={cn(
										"flex flex-col gap-2 rounded-md border p-3 transition-colors",
										isCurrent
											? "border-primary/50 bg-primary/5"
											: "border-border",
									)}
								>
									<div className="flex items-center gap-2">
										<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums">
											{index + 1}
										</span>
										<span className="text-sm font-medium text-foreground">
											{descriptor.label}
										</span>
										{descriptor.optional ? (
											<Badge variant="outline" className="text-[10px]">
												optional
											</Badge>
										) : null}
										{isCurrent ? (
											<LuCircleCheck className="ml-auto size-4 text-primary" />
										) : (
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="ml-auto h-7 text-xs"
												onClick={() =>
													updateRun(run.id, { phase: descriptor.phase })
												}
											>
												Set current
											</Button>
										)}
									</div>
									<p className="text-xs text-muted-foreground">
										{descriptor.description}
									</p>
									<CommandBlock command={phaseCommand(descriptor.phase)} />
								</div>
							);
						})}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm">3. Monitor progress</CardTitle>
						<CardDescription>
							Run in a separate terminal (not inside the Claude session) to
							watch the RLCR loop.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{monitorCommand ? (
							<CommandBlock command={monitorCommand} />
						) : (
							<p className="text-sm text-muted-foreground">
								Bundled loop plugin not found in this build.
							</p>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
