import { cn } from "@superset/ui/utils";
import { LuCheck, LuX } from "react-icons/lu";

export const LOOP_STEPS = [
	"Idea",
	"Plan",
	"Build",
	"Review",
	"Finalize",
	"Done",
] as const;

interface LoopStepperProps {
	/** Index of the current step within LOOP_STEPS. */
	activeIndex: number;
	/** Overall run state, drives the active-step accent. */
	state: "running" | "done" | "error";
}

/**
 * Compact vertical stepper of the loop workflow phases. Steps before the
 * active one render as completed; the active one pulses (or shows an error
 * marker when the run stopped abnormally).
 */
export function LoopStepper({ activeIndex, state }: LoopStepperProps) {
	return (
		<ol className="flex flex-col gap-1">
			{LOOP_STEPS.map((label, index) => {
				const isComplete = index < activeIndex || state === "done";
				const isActive = index === activeIndex && state !== "done";
				const isError = isActive && state === "error";
				return (
					<li key={label} className="flex items-center gap-2">
						<span
							className={cn(
								"flex size-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold",
								isError && "border-destructive bg-destructive text-white",
								!isError &&
									isComplete &&
									"border-transparent bg-primary text-primary-foreground",
								!isError &&
									isActive &&
									"border-primary text-primary animate-pulse",
								!isComplete &&
									!isActive &&
									"border-border text-muted-foreground",
							)}
						>
							{isError ? (
								<LuX className="size-2.5" />
							) : isComplete ? (
								<LuCheck className="size-2.5" />
							) : (
								index + 1
							)}
						</span>
						<span
							className={cn(
								"text-xs",
								isActive && !isError && "font-medium text-foreground",
								isError && "font-medium text-destructive",
								isComplete && "text-foreground",
								!isComplete && !isActive && "text-muted-foreground",
							)}
						>
							{label}
						</span>
					</li>
				);
			})}
		</ol>
	);
}
