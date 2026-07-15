const fs = require("node:fs");
const extractResults = JSON.parse(
	fs.readFileSync(
		"/Users/wushengyu/Develop/hustle/superset/apps/desktop/.ua/tmp/ua-file-extract-results-4.json",
		"utf8",
	),
);
const dispatch = JSON.parse(
	fs.readFileSync(
		"/Users/wushengyu/Develop/hustle/superset/apps/desktop/.ua/tmp/dispatch-4.json",
		"utf8",
	),
);

// Expert-authored file summaries + tags
const fileMeta = {
	"src/lib/trpc/routers/window.ts": {
		s: "tRPC router exposing window control procedures (minimize, maximize, close, zoom) plus directory-selection and image-file open dialogs to the renderer.",
		t: ["api-handler", "trpc", "electron", "window-management"],
	},
	"src/renderer/components/CommentMarkdown/index.ts": {
		s: "Barrel re-exporting the CommentMarkdown component.",
		t: ["barrel", "entry-point", "component"],
	},
	"src/renderer/components/MarkdownRenderer/components/TipTapMarkdownRenderer/index.ts":
		{
			s: "Barrel re-exporting the TipTapMarkdownRenderer component.",
			t: ["barrel", "entry-point", "component"],
		},
	"src/renderer/hooks/host-service/useGitStatus/index.ts": {
		s: "Barrel re-exporting the useGitStatus host-service hook.",
		t: ["barrel", "entry-point", "hook"],
	},
	"src/renderer/hooks/useV2UserPreferences/index.ts": {
		s: "Barrel re-exporting the useV2UserPreferences hook and its API type.",
		t: ["barrel", "entry-point", "hook"],
	},
	"src/renderer/lib/pathBasename/index.ts": {
		s: "Barrel re-exporting the getBaseName path helper.",
		t: ["barrel", "entry-point", "utility"],
	},
	"src/renderer/lib/performance/stress-instrumentation.ts": {
		s: "Performance instrumentation helpers that measure render frequency and emit stress-debug logging in development.",
		t: ["utility", "performance", "instrumentation", "hook"],
	},
	"src/renderer/lib/ringtones/play.ts": {
		s: "Notification ringtone playback: resolves ringtone URLs, caches audio elements, and plays via main-process or HTML audio with autoplay error handling.",
		t: ["utility", "audio", "notifications", "ringtones"],
	},
	"src/renderer/lib/ringtones/urls.ts": {
		s: "Static mapping of built-in ringtone IDs to their bundled audio asset URLs.",
		t: ["configuration", "audio", "ringtones", "data"],
	},
	"src/renderer/lib/terminal/terminal-background-intents.ts": {
		s: "In-memory store tracking which terminals are marked to keep running in the background per workspace, with a pub/sub subscription API.",
		t: ["utility", "terminal", "state", "pub-sub"],
	},
	"src/renderer/routes/_authenticated/_dashboard/components/AddRepositoryModals/components/GitInitConfirmDialog/GitInitConfirmDialog.tsx":
		{
			s: "Dialog prompting the user to confirm initializing a git repository in a chosen non-git folder.",
			t: ["component", "dialog", "git", "ui"],
		},
	"src/renderer/routes/_authenticated/_dashboard/components/AddRepositoryModals/hooks/useFolderFirstImport/useFolderFirstImport.ts":
		{
			s: "Hook driving the folder-first project import flow: directory selection, host-service lookup, git-init confirmation, and project creation/setup.",
			t: ["hook", "import", "git", "host-service"],
		},
	"src/renderer/routes/_authenticated/_dashboard/components/TopBar/components/RightSidebarToggle/RightSidebarToggle.tsx":
		{
			s: "Toolbar toggle button controlling right-sidebar visibility, wired to a user preference and keyboard hotkey.",
			t: ["component", "toolbar", "sidebar", "hotkey"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/AddTabMenu/index.ts":
		{
			s: "Barrel re-exporting the AddTabMenu component.",
			t: ["barrel", "entry-point", "component"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/BackgroundTerminalsButton/BackgroundTerminalsButton.tsx":
		{
			s: "Popover button listing terminals running in the background, letting the user adopt them into panes or kill them, with debounced attachment tracking.",
			t: ["component", "terminal", "popover", "ui"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/BackgroundTerminalsButton/BackgroundTerminalsButton.utils.test.ts":
		{
			s: "Unit tests for the background-terminals utility functions covering attachment keys and session filtering.",
			t: ["test", "terminal", "unit-test"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/BackgroundTerminalsButton/BackgroundTerminalsButton.utils.ts":
		{
			s: "Pure helpers computing attached vs background terminal sets, serialization keys, and polling intervals for the background terminals button.",
			t: ["utility", "terminal", "serialization"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/BackgroundTerminalsButton/index.ts":
		{
			s: "Barrel re-exporting the BackgroundTerminalsButton component.",
			t: ["barrel", "entry-point", "component"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/V2NotificationStatusIndicator/index.ts":
		{
			s: "Barrel re-exporting the V2NotificationStatusIndicator component.",
			t: ["barrel", "entry-point", "component"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/V2PresetsBar/index.ts":
		{
			s: "Barrel re-exporting the V2PresetsBar component.",
			t: ["barrel", "entry-point", "component"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/V2WorkspaceRunButton/index.ts":
		{
			s: "Barrel re-exporting the V2WorkspaceRunButton component.",
			t: ["barrel", "entry-point", "component"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/WorkspaceEmptyState/index.ts":
		{
			s: "Barrel re-exporting the WorkspaceEmptyState component.",
			t: ["barrel", "entry-point", "component"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/WorkspaceMissingWorktreeState/index.ts":
		{
			s: "Barrel re-exporting the WorkspaceMissingWorktreeState component.",
			t: ["barrel", "entry-point", "component"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/WorkspaceSidebar/components/PRActionHeader/PRActionHeader.tsx":
		{
			s: "Sidebar header orchestrating pull-request actions, rendering the appropriate action button, create-PR control, and unavailability tooltips from PR flow state.",
			t: ["component", "pull-request", "sidebar", "ui"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/WorkspaceSidebar/components/PRActionHeader/components/PRStatusGroup/PRStatusGroup.tsx":
		{
			s: "PR status panel showing check rollups and a merge action, wiring tRPC refresh/merge mutations with toast feedback and state-based tinting.",
			t: ["component", "pull-request", "trpc", "ui"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/WorkspaceSidebar/components/PRActionHeader/components/PRStatusGroup/components/PRDetailCard/PRDetailCard.tsx":
		{
			s: "Detail card rendering a pull request title, state pill, CI checks line, and relative timestamp.",
			t: ["component", "pull-request", "ui"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/WorkspaceSidebar/components/PRActionHeader/components/PRStatusGroup/components/PRDetailCard/index.ts":
		{
			s: "Barrel re-exporting the PRDetailCard component.",
			t: ["barrel", "entry-point", "component"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/WorkspaceSidebar/components/PRActionHeader/components/PRStatusGroup/components/PRStatusIndicators/PRStatusIndicators.tsx":
		{
			s: "Compact row of colored dots visualizing individual CI check statuses.",
			t: ["component", "pull-request", "ci", "ui"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/WorkspaceSidebar/components/PRActionHeader/components/PRStatusGroup/components/PRStatusIndicators/index.ts":
		{
			s: "Barrel re-exporting the PRStatusIndicators component.",
			t: ["barrel", "entry-point", "component"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/WorkspaceSidebar/components/PRActionHeader/components/PRStatusGroup/index.ts":
		{
			s: "Barrel re-exporting the PRStatusGroup component.",
			t: ["barrel", "entry-point", "component"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/WorkspaceSidebar/components/PRActionHeader/utils/buildPRContext/buildPRContext.test.ts":
		{
			s: "Unit tests validating PR context text generation across synced and no-PR flow states.",
			t: ["test", "pull-request", "unit-test"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/WorkspaceSidebar/components/PRActionHeader/utils/buildPRContext/buildPRContext.ts":
		{
			s: "Builds multi-line contextual help/prompt text describing the current pull-request flow state for agent hand-off.",
			t: ["utility", "pull-request", "text-generation"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/WorkspaceSidebar/components/PRActionHeader/utils/buildPRContext/index.ts":
		{
			s: "Barrel re-exporting the buildPRContext utility.",
			t: ["barrel", "entry-point", "utility"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/WorkspaceSidebar/components/PRActionHeader/utils/computeChecksStatus/computeChecksStatus.ts":
		{
			s: "Normalizes GitHub check status/conclusion values and rolls up individual checks into an aggregate pass/fail/pending summary.",
			t: ["utility", "pull-request", "ci", "validation"],
		},
	"src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/WorkspaceSidebar/components/PRActionHeader/utils/computeChecksStatus/index.ts":
		{
			s: "Barrel re-exporting the computeChecksStatus utilities and types.",
			t: ["barrel", "entry-point", "type-definition"],
		},
};

// Expert-authored function summaries
const funcSummaries = {
	createWindowRouter:
		"Factory building the tRPC window router with procedures for window controls, zoom, path stat, directory selection, and image dialogs.",
	useRenderStressInstrumentation:
		"React hook that tracks render timing and warns when a component re-renders faster than a configured threshold.",
	logStressEvent: "Emits a structured stress-debug event to the console.",
	resolveRingtoneUrl:
		"Resolves a ringtone ID to its playable URL, falling back to the default ringtone when unknown.",
	getBuiltInAudio:
		"Returns a cached HTMLAudioElement for a built-in ringtone URL, lazily creating it.",
	isUserGesturePlaybackError:
		"Detects whether a playback failure is due to browser autoplay/user-gesture restrictions.",
	playRingtone:
		"Plays a notification ringtone at clamped volume via the main process or HTML audio, tolerating autoplay errors.",
	markTerminalForBackground:
		"Marks a terminal to keep running in the background for a workspace and notifies subscribers.",
	consumeTerminalBackgroundIntent:
		"Consumes and clears a terminal’s pending background intent flag.",
	clearTerminalBackgroundMarker:
		"Removes a terminal’s background marker for a workspace, cleaning up empty sets and notifying subscribers.",
	getTerminalBackgroundMarkerIdsKey:
		"Builds a stable serialized key of a workspace’s background terminal IDs.",
	subscribeTerminalBackgroundMarkers:
		"Registers a listener for background marker changes and returns an unsubscribe function.",
	GitInitConfirmDialog:
		"Dialog component confirming git initialization for a selected folder, showing the folder basename.",
	useFolderFirstImport:
		"Hook running the folder-first import flow: pick directory, look up host service, confirm git init, then create/setup the project.",
	RightSidebarToggle:
		"Toggle button component that flips the right-sidebar preference and reflects the bound hotkey.",
	getAttachedTerminalIdsKey:
		"Computes a stable, sorted key of terminal IDs currently attached to workspace tabs.",
	parseAttachedTerminalIdsKey:
		"Parses a serialized attached-terminal-IDs key back into a string array.",
	getBackgroundTerminalSessions:
		"Filters and sorts terminal sessions to those not attached to any tab (running in background).",
	getUnattachedTerminalIds:
		"Returns deduplicated, sorted terminal IDs that are not attached to a tab.",
	getBackgroundTerminalCountRefetchInterval:
		"Chooses the count-poll interval based on whether the popover is open.",
	getBackgroundTerminalListRefetchInterval:
		"Chooses the list-poll interval based on whether the popover is open.",
	PRActionHeader:
		"Renders the pull-request action header, selecting the correct action button from the PR flow state.",
	ActionSlot:
		"Internal component rendering the correct PR action button (create, sync, retry) for a given variant.",
	UnavailableIcon:
		"Renders a disabled icon with a tooltip explaining why a PR action is unavailable.",
	unavailableTooltip:
		"Maps an unavailable reason code to human-readable tooltip text.",
	CreatePRIconButton:
		"Icon button that dispatches the create-pull-request action.",
	PRStatusGroup:
		"Renders PR status with a checks rollup and merge control, wiring refresh/merge tRPC mutations and toast feedback.",
	stateTintClasses:
		"Maps a PR flow state to Tailwind tint classes for the status container.",
	PRDetailCard:
		"Renders a pull request detail card with title, state pill, checks line, and relative update time.",
	ChecksLine: "Renders a summarized line of CI check counts by status.",
	DetailLine:
		"Renders a single labeled detail row with optional icon and accent.",
	stateLabelToPillClass: "Maps a PR state label to its pill styling classes.",
	PRStatusIndicators: "Renders a row of colored dots, one per CI check status.",
	ChecksDot: "Renders a single colored dot representing one check status.",
	sync: "Test helper constructing a synced PR flow-state fixture with overrides.",
	buildPRContext:
		"Builds contextual PR help/prompt text from the current PR flow state.",
	renderNoPR:
		"Renders the multi-line context text used when no pull request exists yet.",
	coerceCheckStatus:
		"Coerces raw GitHub check status/conclusion into a normalized effective check status.",
	computeChecksRollup:
		"Aggregates individual check results into a rollup of pass/fail/pending counts and overall status.",
};

const nodes = [];
const edges = [];

function _fileTags(fp, _result) {
	if (fileMeta[fp]) return fileMeta[fp].t.slice(0, 5);
	const t = ["typescript", "module", "code"];
	return t;
}

for (const result of extractResults.results) {
	const fp = result.path;
	const meta = fileMeta[fp];
	const summary = meta
		? meta.s
		: `TypeScript module with ${result.metrics?.functionCount || 0} function(s).`;
	const tags = meta ? meta.t.slice(0, 5) : ["typescript", "module", "code"];
	let complexity = "simple";
	if (result.nonEmptyLines > 200) complexity = "complex";
	else if (result.nonEmptyLines > 50) complexity = "moderate";

	nodes.push({
		id: `file:${fp}`,
		type: "file",
		name: fp.split("/").pop(),
		filePath: fp,
		summary,
		tags,
		complexity,
	});

	for (const func of result.functions || []) {
		const lc = func.endLine - func.startLine + 1;
		const isExp = result.exports?.some((e) => e.name === func.name);
		if (lc < 10 && !isExp) continue;
		const ftags = ["function"];
		if (func.name.startsWith("use")) ftags.push("hook");
		else if (/^[A-Z]/.test(func.name)) ftags.push("component");
		if (func.name.toLowerCase().includes("handle")) ftags.push("event-handler");
		if (isExp) ftags.push("exported");
		while (ftags.length < 3) ftags.push("utility");
		let fc = "simple";
		if (lc > 80) fc = "complex";
		else if (lc > 30) fc = "moderate";
		nodes.push({
			id: `function:${fp}:${func.name}`,
			type: "function",
			name: func.name,
			filePath: fp,
			lineRange: [func.startLine, func.endLine],
			summary:
				funcSummaries[func.name] ||
				`Function taking ${func.params?.length || 0} parameter(s).`,
			tags: ftags.slice(0, 5),
			complexity: fc,
		});
		edges.push({
			source: `file:${fp}`,
			target: `function:${fp}:${func.name}`,
			type: "contains",
			direction: "forward",
			weight: 1.0,
		});
		if (isExp)
			edges.push({
				source: `file:${fp}`,
				target: `function:${fp}:${func.name}`,
				type: "exports",
				direction: "forward",
				weight: 0.8,
			});
	}
	for (const imp of dispatch.batchImportData[fp] || []) {
		edges.push({
			source: `file:${fp}`,
			target: `file:${imp}`,
			type: "imports",
			direction: "forward",
			weight: 0.7,
		});
	}
}

// High-confidence cross-file calls edges (target symbols confirmed in neighborMap or same-batch functions)
const callEdges = [
	// resolveRingtoneUrl -> getRingtoneById (src/shared/ringtones.ts neighbor)
	[
		"function:src/renderer/lib/ringtones/play.ts:resolveRingtoneUrl",
		"function:src/shared/ringtones.ts:getRingtoneById",
	],
	// computeChecksRollup -> coerceCheckStatus (same file)
	[
		"function:src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/WorkspaceSidebar/components/PRActionHeader/utils/computeChecksStatus/computeChecksStatus.ts:computeChecksRollup",
		"function:src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/WorkspaceSidebar/components/PRActionHeader/utils/computeChecksStatus/computeChecksStatus.ts:coerceCheckStatus",
	],
	// buildPRContext -> renderNoPR (same file)
	[
		"function:src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/WorkspaceSidebar/components/PRActionHeader/utils/buildPRContext/buildPRContext.ts:buildPRContext",
		"function:src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/components/WorkspaceSidebar/components/PRActionHeader/utils/buildPRContext/buildPRContext.ts:renderNoPR",
	],
];
const nodeIds = new Set(nodes.map((n) => n.id));
for (const [s, t] of callEdges) {
	if (nodeIds.has(s))
		edges.push({
			source: s,
			target: t,
			type: "calls",
			direction: "forward",
			weight: 0.8,
		});
}

// ---- Split into parts: sort files alphabetically, chunk ----
const files = extractResults.results.map((r) => r.path).sort();
const nodeCount = nodes.length,
	edgeCount = edges.length;
let parts = 1;
if (nodeCount > 60 || edgeCount > 120)
	parts = Math.ceil(Math.max(nodeCount / 60, edgeCount / 120));
console.log(`nodes=${nodeCount} edges=${edgeCount} parts=${parts}`);

const outDir =
	"/Users/wushengyu/Develop/hustle/superset/apps/desktop/.ua/intermediate";
if (parts === 1) {
	fs.writeFileSync(
		`${outDir}/batch-4.json`,
		JSON.stringify({ nodes, edges }, null, 2),
	);
	console.log("wrote batch-4.json");
} else {
	const chunkSize = Math.ceil(files.length / parts);
	for (let k = 0; k < parts; k++) {
		const pf = new Set(files.slice(k * chunkSize, (k + 1) * chunkSize));
		const pn = nodes.filter((n) => pf.has(n.filePath));
		const pnIds = new Set(pn.map((n) => n.id));
		const pe = edges.filter((e) => {
			// source belongs to this part's nodes
			return pnIds.has(e.source);
		});
		fs.writeFileSync(
			`${outDir}/batch-4-part-${k + 1}.json`,
			JSON.stringify({ nodes: pn, edges: pe }, null, 2),
		);
		console.log(
			`wrote batch-4-part-${k + 1}.json: ${pn.length} nodes, ${pe.length} edges`,
		);
	}
}
