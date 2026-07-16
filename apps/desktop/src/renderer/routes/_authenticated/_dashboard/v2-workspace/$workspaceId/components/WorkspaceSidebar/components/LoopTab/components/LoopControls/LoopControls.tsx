import { Button } from "@superset/ui/button";
import { LuPause, LuPlay, LuRotateCw, LuSquare } from "react-icons/lu";

interface LoopControlsProps {
	disabled: boolean;
	onStop: () => void;
	onRetry: () => void;
	onInterrupt: () => void;
	onResume: () => void;
}

/**
 * Runtime controls for an active RLCR loop. Every action is delivered by
 * injecting into the loop Claude terminal:
 *   - Stop     → `/rloop:cancel-rlcr-loop`
 *   - Retry    → "try again" (recover a failed round)
 *   - Interrupt→ Ctrl-C (best-effort pause; the plugin has no true pause)
 *   - Resume   → "continue"
 */
export function LoopControls({
	disabled,
	onStop,
	onRetry,
	onInterrupt,
	onResume,
}: LoopControlsProps) {
	return (
		<div className="flex flex-col gap-2">
			<div className="grid grid-cols-2 gap-2">
				<Button
					variant="outline"
					size="sm"
					className="gap-1.5"
					disabled={disabled}
					onClick={onInterrupt}
				>
					<LuPause className="size-3.5" />
					Pause
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="gap-1.5"
					disabled={disabled}
					onClick={onResume}
				>
					<LuPlay className="size-3.5" />
					Resume
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="gap-1.5"
					disabled={disabled}
					onClick={onRetry}
				>
					<LuRotateCw className="size-3.5" />
					Retry
				</Button>
				<Button
					variant="destructive"
					size="sm"
					className="gap-1.5"
					disabled={disabled}
					onClick={onStop}
				>
					<LuSquare className="size-3.5" />
					Stop
				</Button>
			</div>
			<p className="text-[11px] text-muted-foreground">
				Pause interrupts Claude's current turn; the loop plugin has no true
				pause, so Resume sends “continue”.
			</p>
		</div>
	);
}
