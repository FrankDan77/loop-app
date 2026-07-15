import fs from "node:fs";

const P = "apps/desktop/src/renderer/";
const R = `${P}routes/_authenticated/_dashboard/`;
const WS = `${R}v2-workspace/$workspaceId/`;
const PRAH = `${WS}components/WorkspaceSidebar/components/PRActionHeader/`;

function fileNode(
	id,
	type,
	name,
	filePath,
	summary,
	tags,
	complexity,
	languageNotes,
) {
	const n = { id, type, name, filePath, summary, tags, complexity };
	if (languageNotes) n.languageNotes = languageNotes;
	return n;
}
function fnNode(
	id,
	type,
	name,
	filePath,
	lineRange,
	summary,
	tags,
	complexity,
) {
	return { id, type, name, filePath, lineRange, summary, tags, complexity };
}
function edge(source, target, type, weight) {
	return { source, target, type, direction: "forward", weight };
}

const nodes = [];
const edges = [];

// ---------- PART 1 FILES ----------

// 1. CommentMarkdown/index.ts
nodes.push(
	fileNode(
		`file:${P}components/CommentMarkdown/index.ts`,
		"file",
		"index.ts",
		`${P}components/CommentMarkdown/index.ts`,
		"Barrel re-export exposing the CommentMarkdown component to the rest of the renderer.",
		["barrel", "entry-point", "re-export"],
		"simple",
	),
);

// 2. TipTapMarkdownRenderer/index.ts
nodes.push(
	fileNode(
		`file:${P}components/MarkdownRenderer/components/TipTapMarkdownRenderer/index.ts`,
		"file",
		"index.ts",
		`${P}components/MarkdownRenderer/components/TipTapMarkdownRenderer/index.ts`,
		"Barrel re-export exposing the TipTapMarkdownRenderer component.",
		["barrel", "entry-point", "re-export"],
		"simple",
	),
);

// 3. useGitStatus/index.ts
nodes.push(
	fileNode(
		`file:${P}hooks/host-service/useGitStatus/index.ts`,
		"file",
		"index.ts",
		`${P}hooks/host-service/useGitStatus/index.ts`,
		"Barrel re-export exposing the useGitStatus host-service hook.",
		["barrel", "entry-point", "re-export", "hook"],
		"simple",
	),
);

// 4. useTerminalAgentStatuses/index.ts
nodes.push(
	fileNode(
		`file:${P}hooks/host-service/useTerminalAgentStatuses/index.ts`,
		"file",
		"index.ts",
		`${P}hooks/host-service/useTerminalAgentStatuses/index.ts`,
		"Barrel re-export exposing the deriveTerminalAgentStatus helper and useTerminalAgentStatuses hook.",
		["barrel", "entry-point", "re-export", "hook"],
		"simple",
	),
);

// 5. useV2NotificationStatus/index.ts
nodes.push(
	fileNode(
		`file:${P}hooks/host-service/useV2NotificationStatus/index.ts`,
		"file",
		"index.ts",
		`${P}hooks/host-service/useV2NotificationStatus/index.ts`,
		"Barrel re-export exposing the full set of v2 notification-status hooks (source, pane, workspace, unread, mark-seen, attention count).",
		["barrel", "entry-point", "re-export", "hook"],
		"simple",
	),
);

// 6. useV2NotificationStatus.ts
const f6 = `${P}hooks/host-service/useV2NotificationStatus/useV2NotificationStatus.ts`;
nodes.push(
	fileNode(
		`file:${f6}`,
		"file",
		"useV2NotificationStatus.ts",
		f6,
		"Derives v2 notification/attention status (working/permission/review) for terminal-bound agent sources, aggregating per-pane, per-workspace, and dock-badge-level views from terminal agent status and the manual-unread store.",
		["hook", "state-management", "notification", "aggregation"],
		"moderate",
		"Combines a React Query cache subscription with useMemo/useSyncExternalStore-style patterns to recompute the workspace attention count only when the terminal-agent-bindings query cache actually changes.",
	),
);
nodes.push(
	fnNode(
		`function:${f6}:terminalIdsFromSources`,
		"function",
		"terminalIdsFromSources",
		f6,
		[25, 35],
		"Extracts the terminal IDs embedded in a set of notification source keys, filtering to only the `terminal:` prefixed ones.",
		["utility", "parsing"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f6}:useV2SourcesNotificationStatus`,
		"function",
		"useV2SourcesNotificationStatus",
		f6,
		[42, 52],
		"Returns the highest-priority status across a set of notification sources, deriving terminal statuses from host agent bindings.",
		["hook", "notification", "aggregation"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f6}:useV2PaneNotificationStatus`,
		"function",
		"useV2PaneNotificationStatus",
		f6,
		[54, 62],
		"Convenience wrapper computing notification status for a single pane's sources.",
		["hook", "notification"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f6}:useV2WorkspaceNotificationStatus`,
		"function",
		"useV2WorkspaceNotificationStatus",
		f6,
		[64, 75],
		"Computes the workspace-wide notification status, folding in the manual-unread flag as a synthetic 'review' status.",
		["hook", "notification", "aggregation"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f6}:useV2WorkspaceIsUnread`,
		"function",
		"useV2WorkspaceIsUnread",
		f6,
		[77, 87],
		"Boolean hook indicating whether a workspace has any unread/review-worthy terminal or a manual unread mark.",
		["hook", "notification"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f6}:useMarkWorkspaceTerminalsSeen`,
		"function",
		"useMarkWorkspaceTerminalsSeen",
		f6,
		[94, 105],
		"Returns a callback that marks every terminal with a live agent binding in the workspace as seen, clearing derived review statuses.",
		["hook", "event-handler", "notification"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f6}:useV2AttentionWorkspaceCount`,
		"function",
		"useV2AttentionWorkspaceCount",
		f6,
		[114, 150],
		"Counts distinct workspaces needing attention by scanning the react-query cache for terminal-agent-bindings queries plus manual unread marks; drives the OS dock badge.",
		["hook", "aggregation", "notification"],
		"moderate",
	),
);

// 7. useV2UserPreferences/index.ts
nodes.push(
	fileNode(
		`file:${P}hooks/useV2UserPreferences/index.ts`,
		"file",
		"index.ts",
		`${P}hooks/useV2UserPreferences/index.ts`,
		"Barrel re-export exposing the useV2UserPreferences hook and its API type.",
		["barrel", "entry-point", "re-export", "hook"],
		"simple",
	),
);

// 8. pathBasename/index.ts
nodes.push(
	fileNode(
		`file:${P}lib/pathBasename/index.ts`,
		"file",
		"index.ts",
		`${P}lib/pathBasename/index.ts`,
		"Barrel re-export exposing the getBaseName path utility.",
		["barrel", "entry-point", "re-export", "utility"],
		"simple",
	),
);

// 9. stress-instrumentation.ts
const f9 = `${P}lib/performance/stress-instrumentation.ts`;
nodes.push(
	fileNode(
		`file:${f9}`,
		"file",
		"stress-instrumentation.ts",
		f9,
		"Dev-only render-rate instrumentation that warns in the console when a component commits too frequently within a rolling time window.",
		["utility", "performance", "monitoring", "dev-tooling"],
		"moderate",
	),
);
nodes.push(
	fnNode(
		`function:${f9}:useRenderStressInstrumentation`,
		"function",
		"useRenderStressInstrumentation",
		f9,
		[13, 48],
		"Hook that counts renders within a rolling window and logs a warning once a configurable threshold is exceeded; no-ops outside development.",
		["hook", "performance", "monitoring"],
		"moderate",
	),
);
nodes.push(
	fnNode(
		`function:${f9}:logStressEvent`,
		"function",
		"logStressEvent",
		f9,
		[50, 56],
		"Debug-logs an arbitrary named event with details, gated to development builds only.",
		["utility", "monitoring", "dev-tooling"],
		"simple",
	),
);

// 10. ringtones/play.ts
const f10 = `${P}lib/ringtones/play.ts`;
nodes.push(
	fileNode(
		`file:${f10}`,
		"file",
		"play.ts",
		f10,
		"Plays notification ringtones in the renderer, resolving bundled built-in audio URLs or delegating custom ringtone playback to the main process via tRPC.",
		["utility", "audio", "notification"],
		"moderate",
	),
);
nodes.push(
	fnNode(
		`function:${f10}:resolveRingtoneUrl`,
		"function",
		"resolveRingtoneUrl",
		f10,
		[23, 32],
		"Resolves the bundled audio URL for a built-in ringtone id, falling back to the default ringtone if unresolved.",
		["utility", "audio"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f10}:playRingtone`,
		"function",
		"playRingtone",
		f10,
		[53, 85],
		"Plays a ringtone at a given volume, routing custom ringtones through the Electron tRPC client and built-in ringtones through a cached HTMLAudioElement.",
		["api-handler", "audio", "notification"],
		"moderate",
	),
);

// 11. ringtones/urls.ts
nodes.push(
	fileNode(
		`file:${P}lib/ringtones/urls.ts`,
		"file",
		"urls.ts",
		`${P}lib/ringtones/urls.ts`,
		"Static map of built-in ringtone filenames to Vite-bundled asset URLs, keyed to match the filenames declared in shared/ringtones.ts.",
		["configuration", "audio", "data-model"],
		"simple",
	),
);

// 12. terminal-background-intents.ts
const f12 = `${P}lib/terminal/terminal-background-intents.ts`;
nodes.push(
	fileNode(
		`file:${f12}`,
		"file",
		"terminal-background-intents.ts",
		f12,
		"Module-level registry tracking which terminals have been intentionally backgrounded (detached from a pane while their PTY session stays alive), with a subscribable marker store per workspace.",
		["state-management", "singleton", "terminal"],
		"moderate",
	),
);
nodes.push(
	fnNode(
		`function:${f12}:markTerminalForBackground`,
		"function",
		"markTerminalForBackground",
		f12,
		[20, 33],
		"Marks a terminal as intentionally backgrounded and, if a workspace id is given, records it in that workspace's marker set and notifies listeners.",
		["state-management", "terminal"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f12}:consumeTerminalBackgroundIntent`,
		"function",
		"consumeTerminalBackgroundIntent",
		f12,
		[35, 37],
		"Consumes (deletes and returns whether present) the one-shot background intent flag for a terminal id.",
		["state-management", "terminal"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f12}:clearTerminalBackgroundMarker`,
		"function",
		"clearTerminalBackgroundMarker",
		f12,
		[39, 50],
		"Removes a terminal from a workspace's background-marker set and notifies listeners if the set changed.",
		["state-management", "terminal"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f12}:getTerminalBackgroundMarkerIdsKey`,
		"function",
		"getTerminalBackgroundMarkerIdsKey",
		f12,
		[52, 55],
		"Returns a stable JSON-stringified, sorted key of a workspace's background terminal marker ids, for use as a useSyncExternalStore snapshot.",
		["utility", "state-management"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f12}:subscribeTerminalBackgroundMarkers`,
		"function",
		"subscribeTerminalBackgroundMarkers",
		f12,
		[57, 64],
		"Subscribes a listener to background-marker change notifications; returns an unsubscribe function.",
		["event-handler", "state-management"],
		"simple",
	),
);

// 13. terminal-runtime-registry.ts
const f13 = `${P}lib/terminal/terminal-runtime-registry.ts`;
nodes.push(
	fileNode(
		`file:${f13}`,
		"file",
		"terminal-runtime-registry.ts",
		f13,
		"Renderer-wide singleton registry that owns the lifecycle of every terminal's xterm runtime, WebSocket transport, and link manager, keyed by (terminalId, instanceId) so a terminal can be mounted, detached, reconnected, or disposed independently of React component lifecycles.",
		["singleton", "state-management", "terminal", "service"],
		"complex",
		"Preserved across Vite HMR via import.meta.hot.data so live WebSocket connections and xterm instances survive module re-evaluation in dev.",
	),
);
nodes.push({
	id: `class:${f13}:TerminalRuntimeRegistryImpl`,
	type: "class",
	name: "TerminalRuntimeRegistryImpl",
	filePath: f13,
	lineRange: [41, 460],
	summary:
		"Central registry class managing per-terminal xterm runtimes and WebSocket transports; exposes mount/connect/reconnect/detach/dispose lifecycle methods plus terminal control (paste, search, resize) and change-listener subscriptions.",
	tags: ["singleton", "state-management", "terminal", "service"],
	complexity: "complex",
});

// 14. terminal-ws-transport.ts
const f14 = `${P}lib/terminal/terminal-ws-transport.ts`;
nodes.push(
	fileNode(
		`file:${f14}`,
		"file",
		"terminal-ws-transport.ts",
		f14,
		"WebSocket transport layer for a single terminal: connects to the host-service PTY relay, handles reconnect/backoff, laptop-sleep liveness detection, binary PTY output coalescing into xterm, and JSON control messages (title/error/exit).",
		["service", "terminal", "websocket", "state-management"],
		"complex",
		"Relay-routed URLs are pre-flighted with a `_whoowns` affinity probe and freshly-signed JWT before every WebSocket upgrade, since relay-routed terminal tokens rotate hourly and stale tokens would otherwise wedge the reconnect loop.",
	),
);
nodes.push(
	fnNode(
		`function:${f14}:setTerminalTitle`,
		"function",
		"setTerminalTitle",
		f14,
		[122, 135],
		"Updates the transport's title state immediately and debounces title-change listener notifications to prevent flicker on rapid retitling.",
		["state-management", "event-handler"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f14}:pushLog`,
		"function",
		"pushLog",
		f14,
		[137, 160],
		"Appends a capped, ring-buffered transport status log entry and notifies log listeners.",
		["state-management", "logging"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f14}:clearLogs`,
		"function",
		"clearLogs",
		f14,
		[162, 168],
		"Clears a transport's status log and notifies listeners if it was non-empty.",
		["state-management", "logging"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f14}:createTransport`,
		"function",
		"createTransport",
		f14,
		[174, 199],
		"Factory that builds a fresh, disconnected TerminalTransport state object with all internal fields initialized.",
		["factory", "terminal"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f14}:reconnectNow`,
		"function",
		"reconnectNow",
		f14,
		[213, 231],
		"Force-drops a possibly half-open socket and immediately reconnects without waiting for a close event, used when a suspend/resume gap is detected.",
		["terminal", "websocket"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f14}:handleResume`,
		"function",
		"handleResume",
		f14,
		[236, 251],
		"DOM resume handler (online/focus/visibilitychange) that resets backoff and force-reconnects only if the socket is actually dead.",
		["event-handler", "terminal", "websocket"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f14}:setupLiveness`,
		"function",
		"setupLiveness",
		f14,
		[253, 274],
		"Installs the wall-clock watchdog timer and DOM resume listeners used to detect laptop sleep/wake and half-open sockets.",
		["terminal", "websocket", "monitoring"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f14}:teardownLiveness`,
		"function",
		"teardownLiveness",
		f14,
		[276, 292],
		"Removes the liveness watchdog timer and DOM resume listeners installed by setupLiveness.",
		["terminal", "websocket"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f14}:scheduleReconnect`,
		"function",
		"scheduleReconnect",
		f14,
		[294, 316],
		"Schedules an exponential-backoff reconnect attempt, capped at a max delay and max attempt count.",
		["terminal", "websocket"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f14}:appendQueryParam`,
		"function",
		"appendQueryParam",
		f14,
		[351, 361],
		"Appends or overwrites a query parameter on a URL string, with a naive string-append fallback if URL parsing fails.",
		["utility"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f14}:connect`,
		"function",
		"connect",
		f14,
		[363, 481],
		"Opens (or idempotently reuses) the WebSocket connection for a terminal: pre-flights relay affinity for host-routed URLs, signs a fresh JWT, classifies immediate 403 denials, and otherwise opens the socket and attaches listeners.",
		["api-handler", "terminal", "websocket"],
		"complex",
	),
);
nodes.push(
	fnNode(
		`function:${f14}:attachSocketListeners`,
		"function",
		"attachSocketListeners",
		f14,
		[483, 620],
		"Wires open/message/close/error listeners onto a terminal WebSocket: pipes binary PTY frames through the write coalescer, parses JSON control messages (title/attached/error/exit), and drives the reconnect/diagnosis flow on close.",
		["event-handler", "terminal", "websocket"],
		"complex",
	),
);
nodes.push(
	fnNode(
		`function:${f14}:disconnect`,
		"function",
		"disconnect",
		f14,
		[622, 639],
		"Cleanly tears down a transport's socket, liveness watchdog, and coalescer, resetting it to the disconnected state without destroying listener sets.",
		["terminal", "websocket"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f14}:sendResize`,
		"function",
		"sendResize",
		f14,
		[641, 650],
		"Sends a resize control message over the socket when the transport is open.",
		["api-handler", "terminal"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f14}:sendInput`,
		"function",
		"sendInput",
		f14,
		[652, 657],
		"Sends raw terminal input over the socket when the transport is open.",
		["api-handler", "terminal"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f14}:sendDispose`,
		"function",
		"sendDispose",
		f14,
		[659, 663],
		"Sends a dispose control message telling host-service to kill the underlying PTY session.",
		["api-handler", "terminal"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f14}:disposeTransport`,
		"function",
		"disposeTransport",
		f14,
		[665, 689],
		"Fully tears down a transport including all listener sets and logs; used when a terminal is permanently released.",
		["terminal", "websocket"],
		"simple",
	),
);

// 15. terminalConnectionDiagnostics.ts
const f15 = `${P}lib/terminal/terminalConnectionDiagnostics.ts`;
nodes.push(
	fileNode(
		`file:${f15}`,
		"file",
		"terminalConnectionDiagnostics.ts",
		f15,
		"Classifies a failed terminal WebSocket connection into a user-facing category and message using the relay `_whoowns` affinity probe result.",
		["utility", "terminal", "websocket", "validation"],
		"moderate",
	),
);
nodes.push(
	fnNode(
		`function:${f15}:classifyTerminalFailure`,
		"function",
		"classifyTerminalFailure",
		f15,
		[20, 69],
		"Maps a relay affinity probe (or its absence) plus whether the URL is relay-routed into a TerminalFailureClassification with a category and human-readable message.",
		["validation", "terminal", "websocket"],
		"moderate",
	),
);

// 16. write-coalescer.ts
const f16 = `${P}lib/terminal/write-coalescer.ts`;
nodes.push(
	fileNode(
		`file:${f16}`,
		"file",
		"write-coalescer.ts",
		f16,
		"Coalesces PTY output byte chunks into a single xterm.write() call per animation frame, bounding memory with a pending-byte cap that flushes synchronously when exceeded.",
		["utility", "performance", "terminal"],
		"moderate",
		"Batches many small PTY writes into one per rAF to avoid overwhelming xterm's parse/render cycle during high-throughput agent CLI output.",
	),
);
nodes.push(
	fnNode(
		`function:${f16}:createWriteCoalescer`,
		"function",
		"createWriteCoalescer",
		f16,
		[31, 86],
		"Factory returning a WriteCoalescer with push/flushSync/dispose methods that batch Uint8Array chunks into a single write per animation frame.",
		["factory", "performance", "terminal"],
		"moderate",
	),
);

// 17. GitInitConfirmDialog.tsx
const f17 = `${R}components/AddRepositoryModals/components/GitInitConfirmDialog/GitInitConfirmDialog.tsx`;
nodes.push(
	fileNode(
		`file:${f17}`,
		"file",
		"GitInitConfirmDialog.tsx",
		f17,
		"Confirmation dialog prompting the user to initialize git in a folder they picked for import that isn't yet a git repository, driven imperatively by the git-init-confirm store.",
		["component", "dialog", "confirmation"],
		"moderate",
	),
);
nodes.push(
	fnNode(
		`function:${f17}:GitInitConfirmDialog`,
		"function",
		"GitInitConfirmDialog",
		f17,
		[18, 53],
		"Renders an AlertDialog bound to useGitInitConfirmStore, resolving the pending promise with true/false based on the user's Cancel/Initialize choice.",
		["component", "dialog"],
		"moderate",
	),
);

// 18. useDashboardSidebarWorkspaceRunningAgents.ts
const f18 = `${R}components/DashboardSidebar/components/DashboardSidebarWorkspaceItem/components/DashboardSidebarWorkspaceDetails/hooks/useDashboardSidebarWorkspaceRunningAgents/useDashboardSidebarWorkspaceRunningAgents.ts`;
nodes.push(
	fileNode(
		`file:${f18}`,
		"file",
		"useDashboardSidebarWorkspaceRunningAgents.ts",
		f18,
		"Hook producing the live list of agents bound to a workspace's terminals for the dashboard sidebar, merging terminal-agent bindings with their derived notification status.",
		["hook", "aggregation", "dashboard"],
		"moderate",
	),
);
nodes.push(
	fnNode(
		`function:${f18}:useDashboardSidebarWorkspaceRunningAgents`,
		"function",
		"useDashboardSidebarWorkspaceRunningAgents",
		f18,
		[41, 64],
		"Combines useTerminalAgentBindings and useTerminalAgentStatuses into a sorted list of DashboardSidebarRunningAgent entries (newest binding last) for sidebar rendering.",
		["hook", "aggregation", "dashboard"],
		"moderate",
	),
);

// ---------- PART 2 FILES ----------

// 19. RightSidebarToggle.tsx
const f19 = `${R}components/TopBar/components/RightSidebarToggle/RightSidebarToggle.tsx`;
nodes.push(
	fileNode(
		`file:${f19}`,
		"file",
		"RightSidebarToggle.tsx",
		f19,
		"Top-bar button toggling the right sidebar's open/closed preference, with hover-state icon swapping and a hotkey-labeled tooltip.",
		["component", "toolbar", "ui"],
		"moderate",
	),
);
nodes.push(
	fnNode(
		`function:${f19}:RightSidebarToggle`,
		"function",
		"RightSidebarToggle",
		f19,
		[10, 50],
		"Renders the right-sidebar toggle button, reading/writing the open state via useV2UserPreferences and showing a hotkey tooltip.",
		["component", "toolbar"],
		"moderate",
	),
);

// 20. AddTabMenu/index.ts
nodes.push(
	fileNode(
		`file:${WS}components/AddTabMenu/index.ts`,
		"file",
		"index.ts",
		`${WS}components/AddTabMenu/index.ts`,
		"Barrel re-export exposing the AddTabMenu component.",
		["barrel", "entry-point", "re-export"],
		"simple",
	),
);

// 21. BackgroundTerminalsButton.tsx
const f21 = `${WS}components/BackgroundTerminalsButton/BackgroundTerminalsButton.tsx`;
nodes.push(
	fileNode(
		`file:${f21}`,
		"file",
		"BackgroundTerminalsButton.tsx",
		f21,
		"Tab-bar control that surfaces running terminal daemon sessions for a workspace with no attached pane, letting the user re-adopt or kill each background session from a dropdown; renders nothing when there are none.",
		["component", "terminal", "dropdown"],
		"complex",
		"Combines optimistic local background-marker state with debounced tRPC-backed session counts/lists to avoid UI flicker while the server catches up to a just-backgrounded terminal.",
	),
);

// 22. BackgroundTerminalsButton.utils.ts
const f22 = `${WS}components/BackgroundTerminalsButton/BackgroundTerminalsButton.utils.ts`;
nodes.push(
	fileNode(
		`file:${f22}`,
		"file",
		"BackgroundTerminalsButton.utils.ts",
		f22,
		"Pure helper functions and constants for BackgroundTerminalsButton: deriving/parsing the attached-terminal-id cache key, filtering background sessions, and computing refetch intervals.",
		["utility", "terminal"],
		"moderate",
	),
);
nodes.push(
	fnNode(
		`function:${f22}:getAttachedTerminalIdsKey`,
		"function",
		"getAttachedTerminalIdsKey",
		f22,
		[27, 39],
		"Derives a stable, sorted JSON key of terminal ids currently attached to panes across a workspace's tabs.",
		["utility", "terminal"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f22}:parseAttachedTerminalIdsKey`,
		"function",
		"parseAttachedTerminalIdsKey",
		f22,
		[41, 50],
		"Parses the JSON key produced by getAttachedTerminalIdsKey back into a string array, defaulting to empty on malformed input.",
		["utility", "parsing"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f22}:getBackgroundTerminalSessions`,
		"function",
		"getBackgroundTerminalSessions",
		f22,
		[52, 59],
		"Filters a list of terminal sessions down to those not currently attached to a pane, sorted newest-first.",
		["utility", "terminal"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f22}:getUnattachedTerminalIds`,
		"function",
		"getUnattachedTerminalIds",
		f22,
		[61, 69],
		"Returns the sorted set difference between a set of terminal ids and the currently-attached ids.",
		["utility"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f22}:getBackgroundTerminalCountRefetchInterval`,
		"function",
		"getBackgroundTerminalCountRefetchInterval",
		f22,
		[71, 75],
		"Returns the polling interval for the background-session count query, disabled while the dropdown is open.",
		["utility"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f22}:getBackgroundTerminalListRefetchInterval`,
		"function",
		"getBackgroundTerminalListRefetchInterval",
		f22,
		[77, 81],
		"Returns the polling interval for the background-session list query, active only while the dropdown is open.",
		["utility"],
		"simple",
	),
);

// 23. BackgroundTerminalsButton/index.ts
nodes.push(
	fileNode(
		`file:${WS}components/BackgroundTerminalsButton/index.ts`,
		"file",
		"index.ts",
		`${WS}components/BackgroundTerminalsButton/index.ts`,
		"Barrel re-export exposing the BackgroundTerminalsButton component.",
		["barrel", "entry-point", "re-export"],
		"simple",
	),
);

// 24. V2NotificationStatusIndicator.tsx
const f24 = `${WS}components/V2NotificationStatusIndicator/V2NotificationStatusIndicator.tsx`;
nodes.push(
	fileNode(
		`file:${f24}`,
		"file",
		"V2NotificationStatusIndicator.tsx",
		f24,
		"Renders the workspace's shared StatusIndicator for a set of notification sources, resolving the current workspace from context; renders nothing when there is no active status.",
		["component", "notification", "ui"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f24}:V2NotificationStatusIndicator`,
		"function",
		"V2NotificationStatusIndicator",
		f24,
		[11, 19],
		"Computes the notification status for the given sources in the current workspace and renders a StatusIndicator, or null if there is none.",
		["component", "notification"],
		"simple",
	),
);

// 25. V2NotificationStatusIndicator/index.ts
nodes.push(
	fileNode(
		`file:${WS}components/V2NotificationStatusIndicator/index.ts`,
		"file",
		"index.ts",
		`${WS}components/V2NotificationStatusIndicator/index.ts`,
		"Barrel re-export exposing the V2NotificationStatusIndicator component.",
		["barrel", "entry-point", "re-export"],
		"simple",
	),
);

// 26. V2PresetsBar/index.ts
nodes.push(
	fileNode(
		`file:${WS}components/V2PresetsBar/index.ts`,
		"file",
		"index.ts",
		`${WS}components/V2PresetsBar/index.ts`,
		"Barrel re-export exposing the V2PresetsBar component.",
		["barrel", "entry-point", "re-export"],
		"simple",
	),
);

// 27. V2WorkspaceRunButton/index.ts
nodes.push(
	fileNode(
		`file:${WS}components/V2WorkspaceRunButton/index.ts`,
		"file",
		"index.ts",
		`${WS}components/V2WorkspaceRunButton/index.ts`,
		"Barrel re-export exposing the V2WorkspaceRunButton component.",
		["barrel", "entry-point", "re-export"],
		"simple",
	),
);

// 28. WorkspaceEmptyState/index.ts
nodes.push(
	fileNode(
		`file:${WS}components/WorkspaceEmptyState/index.ts`,
		"file",
		"index.ts",
		`${WS}components/WorkspaceEmptyState/index.ts`,
		"Barrel re-export exposing the WorkspaceEmptyState component.",
		["barrel", "entry-point", "re-export"],
		"simple",
	),
);

// 29. WorkspaceMissingWorktreeState/index.ts
nodes.push(
	fileNode(
		`file:${WS}components/WorkspaceMissingWorktreeState/index.ts`,
		"file",
		"index.ts",
		`${WS}components/WorkspaceMissingWorktreeState/index.ts`,
		"Barrel re-export exposing the WorkspaceMissingWorktreeState component.",
		["barrel", "entry-point", "re-export"],
		"simple",
	),
);

// 30. PRActionHeader.tsx
const f30 = `${PRAH}PRActionHeader.tsx`;
nodes.push(
	fileNode(
		`file:${f30}`,
		"file",
		"PRActionHeader.tsx",
		f30,
		"Workspace sidebar header bar showing the pull-request action for the current branch: create-PR button, PR status group, or a retry/unavailable icon, driven by a PR flow state machine.",
		["component", "api-handler", "state-management"],
		"moderate",
	),
);
nodes.push(
	fnNode(
		`function:${f30}:PRActionHeader`,
		"function",
		"PRActionHeader",
		f30,
		[24, 47],
		"Top-level header component that selects an action-button variant from PR flow state and renders the corresponding ActionSlot.",
		["component"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f30}:ActionSlot`,
		"function",
		"ActionSlot",
		f30,
		[54, 118],
		"Switches on the selected action variant (hidden/disabled-tooltip/create-pr-dropdown/cancel-busy/retry) to render the PR status group, an unavailable icon, the create-PR button, or a retry button.",
		["component", "event-handler"],
		"moderate",
	),
);
nodes.push(
	fnNode(
		`function:${f30}:UnavailableIcon`,
		"function",
		"UnavailableIcon",
		f30,
		[120, 138],
		"Renders a muted PR icon with a tooltip explaining why PR creation is unavailable.",
		["component"],
		"moderate",
	),
);
nodes.push(
	fnNode(
		`function:${f30}:unavailableTooltip`,
		"function",
		"unavailableTooltip",
		f30,
		[140, 153],
		"Maps an UnavailableReason (or create-disabled) to its user-facing tooltip copy.",
		["utility"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f30}:CreatePRIconButton`,
		"function",
		"CreatePRIconButton",
		f30,
		[155, 177],
		"Renders the clickable create-PR icon button that dispatches the PR flow with the current state.",
		["component", "event-handler"],
		"moderate",
	),
);

// 31. PRStatusGroup.tsx
const f31 = `${PRAH}components/PRStatusGroup/PRStatusGroup.tsx`;
nodes.push(
	fileNode(
		`file:${f31}`,
		"file",
		"PRStatusGroup.tsx",
		f31,
		"v1-style PR badge showing the PR link, state icon, compact CI/review indicators, a hover-triggered rich detail popover, and (for open non-draft PRs) a squash/merge/rebase dropdown that triggers a GitHub merge and a subsequent local sync.",
		["component", "api-handler", "dropdown"],
		"complex",
	),
);
nodes.push(
	fnNode(
		`function:${f31}:PRStatusGroup`,
		"function",
		"PRStatusGroup",
		f31,
		[41, 208],
		"Renders the PR link/badge with hover card and merge dropdown, wiring the mergePR and refreshByWorkspaces tRPC mutations with toast feedback.",
		["component", "api-handler"],
		"complex",
	),
);
nodes.push(
	fnNode(
		`function:${f31}:stateTintClasses`,
		"function",
		"stateTintClasses",
		f31,
		[215, 252],
		"Maps a PR state (open/merged/closed/draft/queued) to its container/hover/divider Tailwind tint classes.",
		["utility", "styling"],
		"moderate",
	),
);

// 32. PRDetailCard.tsx
const f32 = `${PRAH}components/PRStatusGroup/components/PRDetailCard/PRDetailCard.tsx`;
nodes.push(
	fileNode(
		`file:${f32}`,
		"file",
		"PRDetailCard.tsx",
		f32,
		"Rich hover-card popover content for a PR: title, state pill, head branch, CI/checks summary line, last-updated time, and a link to view the PR on GitHub.",
		["component", "ui"],
		"moderate",
	),
);
nodes.push(
	fnNode(
		`function:${f32}:PRDetailCard`,
		"function",
		"PRDetailCard",
		f32,
		[26, 101],
		"Renders the full PR detail popover body: title/state header, branch row, checks summary, last-updated row, and GitHub link.",
		["component"],
		"moderate",
	),
);
nodes.push(
	fnNode(
		`function:${f32}:ChecksLine`,
		"function",
		"ChecksLine",
		f32,
		[103, 149],
		"Renders the checks-summary line (no checks / all passed / N failing / N running) based on the checks rollup.",
		["component"],
		"moderate",
	),
);
nodes.push(
	fnNode(
		`function:${f32}:DetailLine`,
		"function",
		"DetailLine",
		f32,
		[151, 178],
		"Small presentational row combining an optional icon with accent-colored text, used by ChecksLine.",
		["component"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f32}:stateLabelToPillClass`,
		"function",
		"stateLabelToPillClass",
		f32,
		[180, 193],
		"Maps a PR state to its state-pill Tailwind color classes.",
		["utility", "styling"],
		"simple",
	),
);

// 33. PRDetailCard/index.ts
nodes.push(
	fileNode(
		`file:${PRAH}components/PRStatusGroup/components/PRDetailCard/index.ts`,
		"file",
		"index.ts",
		`${PRAH}components/PRStatusGroup/components/PRDetailCard/index.ts`,
		"Barrel re-export exposing the PRDetailCard component.",
		["barrel", "entry-point", "re-export"],
		"simple",
	),
);

// 34. PRStatusIndicators.tsx
const f34 = `${PRAH}components/PRStatusGroup/components/PRStatusIndicators/PRStatusIndicators.tsx`;
nodes.push(
	fileNode(
		`file:${f34}`,
		"file",
		"PRStatusIndicators.tsx",
		f34,
		"Compact CI-status dot rendered next to the PR number, suppressed entirely when no checks are reported.",
		["component", "ui"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f34}:PRStatusIndicators`,
		"function",
		"PRStatusIndicators",
		f34,
		[13, 21],
		"Renders the checks-status dot wrapper, or null when there are no reported checks.",
		["component"],
		"simple",
	),
);
nodes.push(
	fnNode(
		`function:${f34}:ChecksDot`,
		"function",
		"ChecksDot",
		f34,
		[23, 46],
		"Renders a colored icon (check/x/dashed circle) matching the aggregate checks status.",
		["component"],
		"moderate",
	),
);

// 35. PRStatusIndicators/index.ts
nodes.push(
	fileNode(
		`file:${PRAH}components/PRStatusGroup/components/PRStatusIndicators/index.ts`,
		"file",
		"index.ts",
		`${PRAH}components/PRStatusGroup/components/PRStatusIndicators/index.ts`,
		"Barrel re-export exposing the PRStatusIndicators component.",
		["barrel", "entry-point", "re-export"],
		"simple",
	),
);

// ---------- EDGES ----------

// contains edges: file -> every function/class node created for that file
const fileOfNode = new Map();
for (const n of nodes) {
	if (n.type === "function" || n.type === "class") {
		fileOfNode.set(n.id, `file:${n.filePath}`);
	}
}
for (const [nodeId, fileId] of fileOfNode) {
	edges.push(edge(fileId, nodeId, "contains", 1.0));
}

// exports edges: file -> exported function/class nodes
const exportedIds = new Set([
	`function:${f6}:useV2SourcesNotificationStatus`,
	`function:${f6}:useV2PaneNotificationStatus`,
	`function:${f6}:useV2WorkspaceNotificationStatus`,
	`function:${f6}:useV2WorkspaceIsUnread`,
	`function:${f6}:useMarkWorkspaceTerminalsSeen`,
	`function:${f6}:useV2AttentionWorkspaceCount`,
	`function:${f9}:useRenderStressInstrumentation`,
	`function:${f9}:logStressEvent`,
	`function:${f10}:playRingtone`,
	`function:${f12}:markTerminalForBackground`,
	`function:${f12}:consumeTerminalBackgroundIntent`,
	`function:${f12}:clearTerminalBackgroundMarker`,
	`function:${f12}:getTerminalBackgroundMarkerIdsKey`,
	`function:${f12}:subscribeTerminalBackgroundMarkers`,
	`function:${f14}:clearLogs`,
	`function:${f14}:createTransport`,
	`function:${f14}:connect`,
	`function:${f14}:disconnect`,
	`function:${f14}:sendResize`,
	`function:${f14}:sendInput`,
	`function:${f14}:sendDispose`,
	`function:${f14}:disposeTransport`,
	`function:${f15}:classifyTerminalFailure`,
	`function:${f16}:createWriteCoalescer`,
	`function:${f17}:GitInitConfirmDialog`,
	`function:${f18}:useDashboardSidebarWorkspaceRunningAgents`,
	`function:${f19}:RightSidebarToggle`,
	`function:${f22}:getAttachedTerminalIdsKey`,
	`function:${f22}:parseAttachedTerminalIdsKey`,
	`function:${f22}:getBackgroundTerminalSessions`,
	`function:${f22}:getUnattachedTerminalIds`,
	`function:${f22}:getBackgroundTerminalCountRefetchInterval`,
	`function:${f22}:getBackgroundTerminalListRefetchInterval`,
	`function:${f24}:V2NotificationStatusIndicator`,
	`function:${f30}:PRActionHeader`,
	`function:${f31}:PRStatusGroup`,
	`function:${f32}:PRDetailCard`,
	`function:${f34}:PRStatusIndicators`,
]);
for (const id of exportedIds) {
	const fileId = fileOfNode.get(id);
	if (fileId) edges.push(edge(fileId, id, "exports", 0.8));
}

// imports edges (1:1 with batchImportData)
const batchImportData = JSON.parse(
	fs.readFileSync(
		"/Users/wushengyu/Develop/hustle/superset/.ua/tmp/ua-file-analyzer-input-2.json",
		"utf8",
	),
).batchImportData;
for (const [srcPath, targets] of Object.entries(batchImportData)) {
	for (const t of targets) {
		edges.push(edge(`file:${srcPath}`, `file:${t}`, "imports", 0.7));
	}
}

// calls edges (grounded in source reading above)
edges.push(
	edge(
		`class:${f13}:TerminalRuntimeRegistryImpl`,
		`function:${f14}:createTransport`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`class:${f13}:TerminalRuntimeRegistryImpl`,
		`function:${f14}:connect`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`class:${f13}:TerminalRuntimeRegistryImpl`,
		`function:${f14}:sendResize`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`class:${f13}:TerminalRuntimeRegistryImpl`,
		`function:${f14}:sendInput`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`class:${f13}:TerminalRuntimeRegistryImpl`,
		`function:${f14}:sendDispose`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`class:${f13}:TerminalRuntimeRegistryImpl`,
		`function:${f14}:disposeTransport`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`class:${f13}:TerminalRuntimeRegistryImpl`,
		`function:${f14}:clearLogs`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`function:${f14}:connect`,
		`function:${f15}:classifyTerminalFailure`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`function:${f14}:connect`,
		`function:${f16}:createWriteCoalescer`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`function:${f14}:attachSocketListeners`,
		`function:${f15}:classifyTerminalFailure`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(`function:${f14}:reconnectNow`, `function:${f14}:connect`, "calls", 0.8),
);
edges.push(
	edge(
		`function:${f14}:handleResume`,
		`function:${f14}:reconnectNow`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`function:${f10}:playRingtone`,
		`function:${f10}:resolveRingtoneUrl`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`function:${f6}:useV2PaneNotificationStatus`,
		`function:${f6}:useV2SourcesNotificationStatus`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`function:${f6}:useV2SourcesNotificationStatus`,
		`function:${f6}:terminalIdsFromSources`,
		"calls",
		0.8,
	),
);

edges.push(
	edge(
		`function:${f30}:PRActionHeader`,
		`function:${f30}:ActionSlot`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`function:${f30}:ActionSlot`,
		`function:${f30}:UnavailableIcon`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`function:${f30}:ActionSlot`,
		`function:${f30}:CreatePRIconButton`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`function:${f30}:ActionSlot`,
		`function:${f31}:PRStatusGroup`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`function:${f30}:UnavailableIcon`,
		`function:${f30}:unavailableTooltip`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`function:${f31}:PRStatusGroup`,
		`function:${f32}:PRDetailCard`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`function:${f31}:PRStatusGroup`,
		`function:${f34}:PRStatusIndicators`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`function:${f31}:PRStatusGroup`,
		`function:${f31}:stateTintClasses`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`function:${f32}:PRDetailCard`,
		`function:${f32}:ChecksLine`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`function:${f32}:ChecksLine`,
		`function:${f32}:DetailLine`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`function:${f32}:PRDetailCard`,
		`function:${f32}:stateLabelToPillClass`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`function:${f34}:PRStatusIndicators`,
		`function:${f34}:ChecksDot`,
		"calls",
		0.8,
	),
);
edges.push(
	edge(
		`function:${f24}:V2NotificationStatusIndicator`,
		`function:${f6}:useV2SourcesNotificationStatus`,
		"calls",
		0.8,
	),
);

// ---------- Split into parts by file assignment ----------
const partFilesOrdered = [
	`${P}components/CommentMarkdown/index.ts`,
	`${P}components/MarkdownRenderer/components/TipTapMarkdownRenderer/index.ts`,
	`${P}hooks/host-service/useGitStatus/index.ts`,
	`${P}hooks/host-service/useTerminalAgentStatuses/index.ts`,
	`${P}hooks/host-service/useV2NotificationStatus/index.ts`,
	f6,
	`${P}hooks/useV2UserPreferences/index.ts`,
	`${P}lib/pathBasename/index.ts`,
	f9,
	f10,
	`${P}lib/ringtones/urls.ts`,
	f12,
	f13,
	f14,
	f15,
	f16,
	f17,
	f18,
]; // part 1 (18 files)

const part2Set = new Set([
	f19,
	`${WS}components/AddTabMenu/index.ts`,
	f21,
	f22,
	`${WS}components/BackgroundTerminalsButton/index.ts`,
	f24,
	`${WS}components/V2NotificationStatusIndicator/index.ts`,
	`${WS}components/V2PresetsBar/index.ts`,
	`${WS}components/V2WorkspaceRunButton/index.ts`,
	`${WS}components/WorkspaceEmptyState/index.ts`,
	`${WS}components/WorkspaceMissingWorktreeState/index.ts`,
	f30,
	f31,
	f32,
	`${PRAH}components/PRStatusGroup/components/PRDetailCard/index.ts`,
	f34,
	`${PRAH}components/PRStatusGroup/components/PRStatusIndicators/index.ts`,
]);

const part1Set = new Set(partFilesOrdered);

function nodeFilePath(n) {
	return n.filePath || n.id.split(":").slice(1, -1).join(":");
}

const part1Nodes = nodes.filter((n) => part1Set.has(nodeFilePath(n)));
const part2Nodes = nodes.filter((n) => part2Set.has(nodeFilePath(n)));

console.log(
	"part1Nodes",
	part1Nodes.length,
	"part2Nodes",
	part2Nodes.length,
	"total",
	nodes.length,
);

function sourceFilePath(e) {
	// source is a node id; find its owning file
	const parts = e.source.split(":");
	const prefix = parts[0];
	if (prefix === "file") return parts.slice(1).join(":");
	// function:/class: id -> path is everything between prefix and last segment
	const rest = parts.slice(1);
	return rest.slice(0, -1).join(":");
}

const part1Edges = edges.filter((e) => part1Set.has(sourceFilePath(e)));
const part2Edges = edges.filter((e) => part2Set.has(sourceFilePath(e)));

console.log(
	"part1Edges",
	part1Edges.length,
	"part2Edges",
	part2Edges.length,
	"total",
	edges.length,
);

fs.writeFileSync(
	"/Users/wushengyu/Develop/hustle/superset/.ua/intermediate/batch-2-part-1.json",
	JSON.stringify({ nodes: part1Nodes, edges: part1Edges }, null, 2),
);
fs.writeFileSync(
	"/Users/wushengyu/Develop/hustle/superset/.ua/intermediate/batch-2-part-2.json",
	JSON.stringify({ nodes: part2Nodes, edges: part2Edges }, null, 2),
);

// self-check: all node ids unique, all edge endpoints exist within combined node set OR are known cross-batch/file refs
const allNodeIds = new Set(nodes.map((n) => n.id));
let dupCount = 0;
const seen = new Set();
for (const n of nodes) {
	if (seen.has(n.id)) dupCount++;
	seen.add(n.id);
}
console.log("duplicate node ids:", dupCount);

let danglingLocal = 0;
for (const e of edges) {
	if (e.type === "imports") continue; // imports target other files/batches, verified separately
	if (!allNodeIds.has(e.source)) {
		console.log("MISSING SOURCE", e.source);
		danglingLocal++;
	}
	if (!allNodeIds.has(e.target)) {
		console.log("MISSING TARGET (non-import)", e.target);
		danglingLocal++;
	}
}
console.log("dangling non-import edges:", danglingLocal);

// verify imports targets are files that exist either in this batch or are plausible project paths (already resolved by scanner)
console.log("Done.");
