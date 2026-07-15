import { Button } from "@superset/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@superset/ui/empty";
import { Input } from "@superset/ui/input";
import { Label } from "@superset/ui/label";
import { Textarea } from "@superset/ui/textarea";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LuArrowRight, LuPlus, LuRefreshCw, LuTrash2 } from "react-icons/lu";
import { LoopPrereqCard } from "./components/LoopPrereqCard";
import {
	type LoopRun,
	selectSortedLoopRuns,
	useLoopRunsStore,
} from "./stores/loop-runs";

export const Route = createFileRoute("/_authenticated/_dashboard/loop/")({
	component: LoopPage,
});

function LoopPage() {
	const navigate = useNavigate();
	const runs = useLoopRunsStore(selectSortedLoopRuns);
	const createRun = useLoopRunsStore((s) => s.createRun);
	const removeRun = useLoopRunsStore((s) => s.removeRun);

	const [name, setName] = useState("");
	const [targetDir, setTargetDir] = useState("");
	const [requirement, setRequirement] = useState("");

	const canCreate =
		targetDir.trim().length > 0 && requirement.trim().length > 0;

	const handleCreate = () => {
		if (!canCreate) return;
		const run = createRun({ name, targetDir, requirement });
		navigate({ to: "/loop/$loopRunId", params: { loopRunId: run.id } });
	};

	return (
		<div className="flex h-full w-full flex-1 flex-col overflow-hidden">
			<header className="flex h-11 shrink-0 items-center gap-3 border-b border-border px-4">
				<LuRefreshCw className="size-4 text-muted-foreground" />
				<h1 className="text-sm font-semibold tracking-tight">Loop</h1>
				<span className="text-xs text-muted-foreground">
					Idea → Plan → Build with Codex review (RLCR)
				</span>
			</header>

			<div className="flex min-h-0 flex-1 gap-6 overflow-y-auto p-6">
				<div className="flex w-full max-w-xl flex-col gap-4">
					<section className="flex flex-col gap-3 rounded-lg border border-border p-4">
						<div>
							<h2 className="text-sm font-semibold">New loop</h2>
							<p className="text-xs text-muted-foreground">
								Start a guided idea → plan → build cycle against a repo.
							</p>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="loop-name">Name</Label>
							<Input
								id="loop-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Add undo/redo to the editor"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="loop-dir">Target repo path</Label>
							<Input
								id="loop-dir"
								value={targetDir}
								onChange={(e) => setTargetDir(e.target.value)}
								placeholder="/Users/you/code/my-project"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="loop-req">Initial requirement</Label>
							<Textarea
								id="loop-req"
								value={requirement}
								onChange={(e) => setRequirement(e.target.value)}
								placeholder="Describe what you want to build…"
								rows={4}
							/>
						</div>
						<div>
							<Button
								type="button"
								className="gap-1.5"
								disabled={!canCreate}
								onClick={handleCreate}
							>
								<LuPlus className="size-4" />
								Create loop
							</Button>
						</div>
					</section>

					{runs.length === 0 ? (
						<Empty className="rounded-lg border border-dashed border-border py-10">
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<LuRefreshCw />
								</EmptyMedia>
								<EmptyTitle>No loops yet</EmptyTitle>
								<EmptyDescription>
									Create a loop above to get started.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						<section className="flex flex-col gap-2">
							<h2 className="text-sm font-semibold">Your loops</h2>
							{runs.map((run) => (
								<LoopRunListItem
									key={run.id}
									run={run}
									onOpen={() =>
										navigate({
											to: "/loop/$loopRunId",
											params: { loopRunId: run.id },
										})
									}
									onDelete={() => removeRun(run.id)}
								/>
							))}
						</section>
					)}
				</div>

				<div className="w-full max-w-sm shrink-0">
					<LoopPrereqCard />
				</div>
			</div>
		</div>
	);
}

function LoopRunListItem({
	run,
	onOpen,
	onDelete,
}: {
	run: LoopRun;
	onOpen: () => void;
	onDelete: () => void;
}) {
	return (
		<div className="group flex items-center gap-3 rounded-md border border-border px-3 py-2.5 transition-colors hover:bg-accent/40">
			<button
				type="button"
				onClick={onOpen}
				className="flex min-w-0 flex-1 flex-col items-start text-left"
			>
				<span className="truncate text-sm font-medium text-foreground">
					{run.name}
				</span>
				<span className="truncate text-xs text-muted-foreground">
					{run.targetDir} · phase: {run.phase}
				</span>
			</button>
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				aria-label="Delete loop"
				className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
				onClick={onDelete}
			>
				<LuTrash2 className="size-4" />
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				aria-label="Open loop"
				onClick={onOpen}
			>
				<LuArrowRight className="size-4" />
			</Button>
		</div>
	);
}
