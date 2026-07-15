import { cn } from "@superset/ui/utils";
import { useId } from "react";

interface LoopLogoProps {
	className?: string;
	gradient?: boolean;
}

export function LoopLogo({ className, gradient = false }: LoopLogoProps) {
	const reactId = useId();
	const gradientId = `loop-logo-gradient-${reactId}`;

	return (
		<svg
			width="240"
			height="48"
			viewBox="0 0 240 48"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={cn("text-foreground", className)}
			aria-label="Loop"
		>
			<title>Loop</title>
			{gradient && (
				<defs>
					<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
						<stop offset="45%" stopColor="currentColor" stopOpacity="0.45" />
						<stop offset="50%" stopColor="currentColor" stopOpacity="1" />
						<stop offset="55%" stopColor="currentColor" stopOpacity="0.45" />
						<stop offset="100%" stopColor="currentColor" stopOpacity="0.35" />
						<animate
							attributeName="x1"
							values="-100%;100%;100%"
							keyTimes="0;0.55;1"
							dur="1.6s"
							repeatCount="indefinite"
						/>
						<animate
							attributeName="x2"
							values="0%;200%;200%"
							keyTimes="0;0.55;1"
							dur="1.6s"
							repeatCount="indefinite"
						/>
					</linearGradient>
				</defs>
			)}
			{/* Loop icon - interlocking squares forming infinity pattern */}
			<g opacity="0.95">
				{/* Left loop */}
				<rect
					x="0"
					y="12"
					width="6"
					height="6"
					fill={gradient ? `url(#${gradientId})` : "currentColor"}
				/>
				<rect
					x="0"
					y="18"
					width="6"
					height="6"
					fill={gradient ? `url(#${gradientId})` : "currentColor"}
				/>
				<rect
					x="0"
					y="24"
					width="6"
					height="6"
					fill={gradient ? `url(#${gradientId})` : "currentColor"}
				/>
				<rect
					x="6"
					y="12"
					width="6"
					height="6"
					fill={gradient ? `url(#${gradientId})` : "currentColor"}
				/>
				<rect
					x="6"
					y="24"
					width="6"
					height="6"
					fill={gradient ? `url(#${gradientId})` : "currentColor"}
				/>
				<rect
					x="12"
					y="12"
					width="6"
					height="6"
					fill={gradient ? `url(#${gradientId})` : "currentColor"}
				/>
				<rect
					x="12"
					y="18"
					width="6"
					height="6"
					fill={gradient ? `url(#${gradientId})` : "currentColor"}
				/>
				<rect
					x="12"
					y="24"
					width="6"
					height="6"
					fill={gradient ? `url(#${gradientId})` : "currentColor"}
				/>
				{/* Right loop */}
				<rect
					x="18"
					y="12"
					width="6"
					height="6"
					fill={gradient ? `url(#${gradientId})` : "currentColor"}
				/>
				<rect
					x="18"
					y="18"
					width="6"
					height="6"
					fill={gradient ? `url(#${gradientId})` : "currentColor"}
				/>
				<rect
					x="18"
					y="24"
					width="6"
					height="6"
					fill={gradient ? `url(#${gradientId})` : "currentColor"}
				/>
				<rect
					x="24"
					y="12"
					width="6"
					height="6"
					fill={gradient ? `url(#${gradientId})` : "currentColor"}
				/>
				<rect
					x="24"
					y="24"
					width="6"
					height="6"
					fill={gradient ? `url(#${gradientId})` : "currentColor"}
				/>
				<rect
					x="30"
					y="12"
					width="6"
					height="6"
					fill={gradient ? `url(#${gradientId})` : "currentColor"}
				/>
				<rect
					x="30"
					y="18"
					width="6"
					height="6"
					fill={gradient ? `url(#${gradientId})` : "currentColor"}
				/>
				<rect
					x="30"
					y="24"
					width="6"
					height="6"
					fill={gradient ? `url(#${gradientId})` : "currentColor"}
				/>
			</g>
			{/* L */}
			<path
				d="M54 12h6v18h9v6h-15V12z"
				fill={gradient ? `url(#${gradientId})` : "currentColor"}
			/>
			{/* O */}
			<path
				d="M81 12h15v6h-9v12h9v6h-15V12zm6 6v12h3V18h-3z"
				fill={gradient ? `url(#${gradientId})` : "currentColor"}
			/>
			{/* O */}
			<path
				d="M108 12h15v6h-9v12h9v6h-15V12zm6 6v12h3V18h-3z"
				fill={gradient ? `url(#${gradientId})` : "currentColor"}
			/>
			{/* P */}
			<path
				d="M135 12h14v6h-8v4h8v6h-8v8h-6V12zm6 6v4h6v-4h-6z"
				fill={gradient ? `url(#${gradientId})` : "currentColor"}
			/>
		</svg>
	);
}
