import { Button } from "@superset/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@superset/ui/card";
import { toast } from "@superset/ui/sonner";
import { cn } from "@superset/ui/utils";
import { LuCircleCheck, LuCircleX, LuRefreshCw } from "react-icons/lu";
import { electronTrpc } from "renderer/lib/electron-trpc";

const PREREQ_LABELS: Record<string, string> = {
	claude: "Claude Code CLI (claude)",
	codex: "Codex CLI (codex)",
	jq: "jq",
	git: "git",
};

interface LoopPrereqCardProps {
	className?: string;
}

/**
 * Shows whether the vendored loop plugin is bundled and which required CLIs are
 * present, with a button to force-reinstall the loop skills into Codex.
 */
export function LoopPrereqCard({ className }: LoopPrereqCardProps) {
	const statusQuery = electronTrpc.settings.loopStatus.useQuery(undefined, {
		refetchOnWindowFocus: false,
	});
	const reinstall = electronTrpc.settings.reinstallLoop.useMutation({
		onSuccess: (result) => {
			if (result.status === "installed") {
				toast.success("Loop plugin reinstalled into Codex");
			} else if (result.status === "skipped") {
				toast.success("Loop plugin already up to date");
			} else if (result.status === "codex-missing") {
				toast.error("Codex CLI not found — install codex first");
			} else if (result.status === "missing-plugin") {
				toast.error("Bundled loop plugin missing from this build");
			} else {
				toast.error("Loop install failed — see logs");
			}
			void statusQuery.refetch();
		},
		onError: (error) => toast.error(error.message ?? "Loop install failed"),
	});

	const data = statusQuery.data;
	const prereqs = data?.prereqs;

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="text-sm">Loop prerequisites</CardTitle>
				<CardDescription>
					Loop drives Claude Code and Codex. The plugin auto-installs on
					startup; reinstall if you just installed the CLIs.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<div className="flex flex-col gap-2">
					<PrereqRow
						label="Bundled loop plugin"
						ok={!!data?.loopDir}
						hint={data?.loopDir ?? "not found in this build"}
					/>
					{prereqs
						? (["claude", "codex", "jq", "git"] as const).map((key) => (
								<PrereqRow
									key={key}
									label={PREREQ_LABELS[key] ?? key}
									ok={prereqs[key]}
									hint={prereqs[key] ? "on PATH" : "not found on PATH"}
								/>
							))
						: null}
				</div>
				<div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="gap-1.5"
						disabled={reinstall.isPending}
						onClick={() => reinstall.mutate()}
					>
						<LuRefreshCw
							className={cn("size-4", reinstall.isPending && "animate-spin")}
						/>
						{reinstall.isPending ? "Installing…" : "Reinstall loop plugin"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function PrereqRow({
	label,
	ok,
	hint,
}: {
	label: string;
	ok: boolean;
	hint: string;
}) {
	return (
		<div className="flex items-center gap-2 text-sm">
			{ok ? (
				<LuCircleCheck className="size-4 shrink-0 text-green-500" />
			) : (
				<LuCircleX className="size-4 shrink-0 text-red-500" />
			)}
			<span className="text-foreground">{label}</span>
			<span className="ml-auto truncate pl-2 text-xs text-muted-foreground">
				{hint}
			</span>
		</div>
	);
}
