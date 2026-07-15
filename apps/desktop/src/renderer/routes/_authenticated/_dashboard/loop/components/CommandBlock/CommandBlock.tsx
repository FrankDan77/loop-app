import { Button } from "@superset/ui/button";
import { toast } from "@superset/ui/sonner";
import { cn } from "@superset/ui/utils";
import { useState } from "react";
import { LuCheck, LuCopy } from "react-icons/lu";

interface CommandBlockProps {
	command: string;
	className?: string;
	/** Optional short caption rendered above the command. */
	label?: string;
}

/**
 * Renders a shell/slash command in a monospace block with a copy-to-clipboard
 * button. The primary way the Loop UI hands off loop plugin commands to the
 * user's terminal.
 */
export function CommandBlock({ command, className, label }: CommandBlockProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(command);
			setCopied(true);
			toast.success("Command copied");
			setTimeout(() => setCopied(false), 1500);
		} catch {
			toast.error("Failed to copy command");
		}
	};

	return (
		<div className={cn("flex flex-col gap-1", className)}>
			{label ? (
				<span className="text-xs font-medium text-muted-foreground">
					{label}
				</span>
			) : null}
			<div className="flex items-stretch gap-2">
				<code className="flex-1 select-text cursor-text overflow-x-auto rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-[13px] leading-relaxed text-foreground">
					{command}
				</code>
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="shrink-0 self-stretch"
					onClick={handleCopy}
					aria-label="Copy command"
				>
					{copied ? (
						<LuCheck className="size-4 text-green-500" />
					) : (
						<LuCopy className="size-4" />
					)}
				</Button>
			</div>
		</div>
	);
}
