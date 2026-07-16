import { Button } from "@superset/ui/button";
import { Spinner } from "@superset/ui/spinner";
import { Textarea } from "@superset/ui/textarea";
import { useState } from "react";
import { LuSparkles } from "react-icons/lu";

interface LoopIdeaFormProps {
	initialIdea?: string;
	isSubmitting: boolean;
	onSubmit: (idea: string) => void;
}

/**
 * Idle-state dialog for the Loop sidebar: the user describes an idea, and
 * submitting kicks off the half-automatic gen-idea → gen-plan flow.
 */
export function LoopIdeaForm({
	initialIdea,
	isSubmitting,
	onSubmit,
}: LoopIdeaFormProps) {
	const [idea, setIdea] = useState(initialIdea ?? "");
	const trimmed = idea.trim();

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
			<div className="flex items-center gap-2 text-foreground">
				<LuSparkles className="size-4 text-primary" />
				<span className="text-sm font-medium">Start a Loop</span>
			</div>
			<p className="text-xs text-muted-foreground">
				Describe an idea. Loop turns it into a draft, then a plan, then runs the
				RLCR loop (Claude implements, Codex reviews) until it converges.
			</p>
			<Textarea
				value={idea}
				onChange={(e) => setIdea(e.target.value)}
				placeholder="e.g. Add a dark-mode toggle to the settings screen…"
				className="min-h-28 resize-none text-sm"
				autoFocus
				onKeyDown={(e) => {
					if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && trimmed) {
						e.preventDefault();
						onSubmit(trimmed);
					}
				}}
			/>
			<Button
				className="w-full gap-2"
				disabled={!trimmed || isSubmitting}
				onClick={() => trimmed && onSubmit(trimmed)}
			>
				{isSubmitting ? <Spinner className="size-4" /> : null}
				Start Loop
			</Button>
			<p className="text-[11px] text-muted-foreground">
				Tip: press <kbd className="font-mono">⌘/Ctrl</kbd> +{" "}
				<kbd className="font-mono">Enter</kbd> to start.
			</p>
		</div>
	);
}
