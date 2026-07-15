import fs from "node:fs";

const files = {
	p1: [
		"apps/desktop/src/renderer/assets/app-icons/preset-icons/index.ts",
		"apps/desktop/src/renderer/commandPalette/CommandPaletteHost.tsx",
		"apps/desktop/src/renderer/commandPalette/core/ContextProvider.tsx",
		"apps/desktop/src/renderer/commandPalette/core/execute.ts",
		"apps/desktop/src/renderer/commandPalette/core/frames.ts",
		"apps/desktop/src/renderer/commandPalette/core/registry.ts",
		"apps/desktop/src/renderer/commandPalette/core/sections.ts",
		"apps/desktop/src/renderer/commandPalette/core/types.ts",
		"apps/desktop/src/renderer/commandPalette/core/useActiveCommands.ts",
		"apps/desktop/src/renderer/commandPalette/modules/actions/commands.tsx",
		"apps/desktop/src/renderer/commandPalette/modules/index.ts",
		"apps/desktop/src/renderer/commandPalette/modules/navigation/commands.tsx",
		"apps/desktop/src/renderer/commandPalette/modules/openIn/commands.ts",
		"apps/desktop/src/renderer/commandPalette/modules/settings/commands.ts",
		"apps/desktop/src/renderer/commandPalette/modules/workspace/commands.tsx",
		"apps/desktop/src/renderer/commandPalette/ui/CommandItemRow/CommandItemRow.tsx",
		"apps/desktop/src/renderer/commandPalette/ui/CommandListView/CommandListView.tsx",
		"apps/desktop/src/renderer/commandPalette/ui/CommandPalette/CommandPalette.tsx",
	],
	p2: [
		"apps/desktop/src/renderer/commandPalette/ui/DeleteWorkspaceMount/DeleteWorkspaceMount.tsx",
		"apps/desktop/src/renderer/commandPalette/ui/LinkTask/LinkTaskFrame.tsx",
		"apps/desktop/src/renderer/commandPalette/ui/QuickOpen/quickOpenStore.ts",
		"apps/desktop/src/renderer/commandPalette/ui/RecentlyViewed/RecentlyViewedFrame.tsx",
		"apps/desktop/src/renderer/commandPalette/ui/RemoveFromSidebarMount/RemoveFromSidebarMount.tsx",
		"apps/desktop/src/renderer/commandPalette/ui/SetPreferredOpenInAppMount/SetPreferredOpenInAppMount.tsx",
		"apps/desktop/src/renderer/commandPalette/ui/SubPaletteView/SubPaletteView.tsx",
		"apps/desktop/src/renderer/commandPalette/ui/ThemeFrame/ThemeFrame.tsx",
		"apps/desktop/src/renderer/commandPalette/ui/WorkspaceList/WorkspaceListFrame.tsx",
		"apps/desktop/src/renderer/commandPalette/ui/WorkspaceList/index.ts",
		"apps/desktop/src/renderer/components/AgentModelSelect/index.ts",
		"apps/desktop/src/renderer/components/AgentSelect/AgentSelect.tsx",
		"apps/desktop/src/renderer/components/AgentSelect/index.ts",
		"apps/desktop/src/renderer/components/Chat/ChatInterface/components/ChatInputFooter/components/LinkedIssuePill/LinkedIssuePill.tsx",
		"apps/desktop/src/renderer/components/Chat/ChatInterface/components/IssueLinkCommand/index.ts",
		"apps/desktop/src/renderer/components/Chat/components/LinkedTaskChip/LinkedTaskChip.tsx",
		"apps/desktop/src/renderer/components/MarkdownEditor/components/FileMention/index.ts",
	],
};

const fileNodes = {
	"apps/desktop/src/renderer/assets/app-icons/preset-icons/index.ts": {
		name: "index.ts",
		summary:
			"Hook utilities for resolving preset agent icon paths and detecting the current dark/light theme.",
		tags: ["hook", "utility", "theme", "icons"],
		complexity: "simple",
	},
	"apps/desktop/src/renderer/commandPalette/CommandPaletteHost.tsx": {
		name: "CommandPaletteHost.tsx",
		summary:
			"Mounts the command context provider and command palette dialog, registering all command modules on startup, and exposes a hotkey trigger.",
		tags: ["provider", "initialization", "command-palette", "hotkey"],
		complexity: "simple",
	},
	"apps/desktop/src/renderer/commandPalette/core/ContextProvider.tsx": {
		name: "ContextProvider.tsx",
		summary:
			"Provides the command execution context (route, active workspace/project, host workspaces, notification-mute state) consumed by command palette providers.",
		tags: ["context-provider", "hook", "command-palette", "live-query"],
		complexity: "moderate",
	},
	"apps/desktop/src/renderer/commandPalette/core/execute.ts": {
		name: "execute.ts",
		summary:
			"Executes a command palette command's action, tracking an analytics event and surfacing a toast if it throws.",
		tags: ["utility", "command-palette", "error-handling", "analytics"],
		complexity: "simple",
	},
	"apps/desktop/src/renderer/commandPalette/core/frames.ts": {
		name: "frames.ts",
		summary:
			"Zustand store managing the command palette's navigation frame stack (push/pop/reset) with analytics tracking on navigation.",
		tags: ["store", "state-management", "command-palette", "navigation"],
		complexity: "simple",
	},
	"apps/desktop/src/renderer/commandPalette/core/registry.ts": {
		name: "registry.ts",
		summary:
			"In-memory registry of command palette command providers with a subscribe/notify pattern for reactive updates.",
		tags: ["registry", "pub-sub", "command-palette", "state-management"],
		complexity: "simple",
	},
	"apps/desktop/src/renderer/commandPalette/core/sections.ts": {
		name: "sections.ts",
		summary:
			"Defines display labels for command palette sections and resolves their ordering based on context.",
		tags: ["utility", "command-palette", "configuration"],
		complexity: "simple",
	},
	"apps/desktop/src/renderer/commandPalette/core/types.ts": {
		name: "types.ts",
		summary:
			"Shared TypeScript type definitions for commands, providers, and context used across the command palette module.",
		tags: ["type-definition", "command-palette"],
		complexity: "simple",
	},
	"apps/desktop/src/renderer/commandPalette/core/useActiveCommands.ts": {
		name: "useActiveCommands.ts",
		summary:
			"Hook that gathers commands from all registered providers, filters/dedupes them by the current context, and groups them into ordered sections.",
		tags: ["hook", "command-palette", "state-management"],
		complexity: "simple",
	},
	"apps/desktop/src/renderer/commandPalette/modules/actions/commands.tsx": {
		name: "commands.tsx",
		summary:
			"Command palette provider exposing general actions such as cycling the theme and toggling notification sound muting.",
		tags: ["command-palette", "provider", "theme", "settings"],
		complexity: "moderate",
	},
	"apps/desktop/src/renderer/commandPalette/modules/index.ts": {
		name: "index.ts",
		summary:
			"Registers the actions, navigation, openIn, and workspace command providers with the command registry on startup.",
		tags: ["registry", "command-palette", "initialization"],
		complexity: "simple",
	},
	"apps/desktop/src/renderer/commandPalette/modules/navigation/commands.tsx": {
		name: "commands.tsx",
		summary:
			"Command palette provider supplying navigation commands such as recently viewed, workspace list, and settings tabs.",
		tags: ["command-palette", "provider", "navigation"],
		complexity: "simple",
	},
	"apps/desktop/src/renderer/commandPalette/modules/openIn/commands.ts": {
		name: "commands.ts",
		summary:
			"Command palette provider that resolves the active workspace path via the host service and opens it in Finder or an external app.",
		tags: [
			"command-palette",
			"provider",
			"host-service",
			"external-integration",
		],
		complexity: "moderate",
	},
	"apps/desktop/src/renderer/commandPalette/modules/settings/commands.ts": {
		name: "commands.ts",
		summary:
			"Command palette provider mapping settings tabs into navigable commands.",
		tags: ["command-palette", "provider", "settings", "navigation"],
		complexity: "moderate",
	},
	"apps/desktop/src/renderer/commandPalette/modules/workspace/commands.tsx": {
		name: "commands.tsx",
		summary:
			"Command palette provider exposing workspace-related commands such as link task, quick open, delete workspace, and remove from sidebar.",
		tags: ["command-palette", "provider", "workspace-management"],
		complexity: "moderate",
	},
	"apps/desktop/src/renderer/commandPalette/ui/CommandItemRow/CommandItemRow.tsx":
		{
			name: "CommandItemRow.tsx",
			summary:
				"Renders a single command palette list item with icon, label, keyword hints, and formatted hotkey display.",
			tags: ["component", "command-palette", "list-item"],
			complexity: "simple",
		},
	"apps/desktop/src/renderer/commandPalette/ui/CommandListView/CommandListView.tsx":
		{
			name: "CommandListView.tsx",
			summary:
				"Renders the sectioned list of currently active commands within the command palette.",
			tags: ["component", "command-palette", "list-view"],
			complexity: "simple",
		},
	"apps/desktop/src/renderer/commandPalette/ui/CommandPalette/CommandPalette.tsx":
		{
			name: "CommandPalette.tsx",
			summary:
				"Root command palette dialog component managing open state, search query, the navigation frame stack, and command execution/back navigation.",
			tags: ["component", "command-palette", "dialog", "state-management"],
			complexity: "moderate",
		},
	"apps/desktop/src/renderer/commandPalette/ui/DeleteWorkspaceMount/DeleteWorkspaceMount.tsx":
		{
			name: "DeleteWorkspaceMount.tsx",
			summary:
				"Headless mount component that opens the delete-workspace confirmation dialog and closes the palette when a delete intent is set.",
			tags: ["component", "command-palette", "workspace-management", "dialog"],
			complexity: "simple",
		},
	"apps/desktop/src/renderer/commandPalette/ui/LinkTask/LinkTaskFrame.tsx": {
		name: "LinkTaskFrame.tsx",
		summary:
			"Command palette frame for searching and linking a task to the active workspace, combining hybrid search with status/priority-sorted default results.",
		tags: ["component", "command-palette", "task-linking", "search"],
		complexity: "moderate",
	},
	"apps/desktop/src/renderer/commandPalette/ui/QuickOpen/quickOpenStore.ts": {
		name: "quickOpenStore.ts",
		summary:
			"Zustand store tracking the currently active TanStack Router route, used to drive quick-open command palette navigation.",
		tags: ["store", "state-management", "command-palette", "routing"],
		complexity: "simple",
	},
	"apps/desktop/src/renderer/commandPalette/ui/RecentlyViewed/RecentlyViewedFrame.tsx":
		{
			name: "RecentlyViewedFrame.tsx",
			summary:
				"Command palette frame that aggregates recently viewed workspaces, v2 workspaces, automations, and tasks with search filtering and per-type navigation.",
			tags: ["component", "command-palette", "recently-viewed", "navigation"],
			complexity: "complex",
			languageNotes:
				"Combines several useLiveQuery joins with a synchronous tRPC query to build a unified recently-viewed list across four entity types.",
		},
	"apps/desktop/src/renderer/commandPalette/ui/RemoveFromSidebarMount/RemoveFromSidebarMount.tsx":
		{
			name: "RemoveFromSidebarMount.tsx",
			summary:
				"Headless mount component that removes a workspace from the sidebar and navigates away when the remove-from-sidebar intent fires.",
			tags: ["component", "command-palette", "sidebar", "workspace-management"],
			complexity: "simple",
		},
	"apps/desktop/src/renderer/commandPalette/ui/SetPreferredOpenInAppMount/SetPreferredOpenInAppMount.tsx":
		{
			name: "SetPreferredOpenInAppMount.tsx",
			summary:
				"Headless mount component that persists a project's preferred 'open in' app choice and ensures the project stays visible in the sidebar.",
			tags: ["component", "command-palette", "preferences", "sidebar"],
			complexity: "simple",
		},
	"apps/desktop/src/renderer/commandPalette/ui/SubPaletteView/SubPaletteView.tsx":
		{
			name: "SubPaletteView.tsx",
			summary:
				"Renders the visible child commands of a parent command frame as a filtered sub-palette list.",
			tags: ["component", "command-palette", "navigation"],
			complexity: "simple",
		},
	"apps/desktop/src/renderer/commandPalette/ui/ThemeFrame/ThemeFrame.tsx": {
		name: "ThemeFrame.tsx",
		summary:
			"Command palette frame for browsing and selecting light, dark, or system themes with search filtering and live color swatches.",
		tags: ["component", "command-palette", "theme", "search"],
		complexity: "moderate",
	},
	"apps/desktop/src/renderer/commandPalette/ui/WorkspaceList/WorkspaceListFrame.tsx":
		{
			name: "WorkspaceListFrame.tsx",
			summary:
				"Command palette frame listing v1 and v2 workspaces grouped by project, with search filtering and navigation handlers.",
			tags: ["component", "command-palette", "workspace-management", "search"],
			complexity: "moderate",
		},
	"apps/desktop/src/renderer/commandPalette/ui/WorkspaceList/index.ts": {
		name: "index.ts",
		summary: "Barrel re-export for the WorkspaceListFrame component.",
		tags: ["barrel", "command-palette", "workspace-management"],
		complexity: "simple",
	},
	"apps/desktop/src/renderer/components/AgentModelSelect/index.ts": {
		name: "index.ts",
		summary: "Barrel re-export for the AgentModelSelect component.",
		tags: ["barrel", "component", "agent-selection"],
		complexity: "simple",
	},
	"apps/desktop/src/renderer/components/AgentSelect/AgentSelect.tsx": {
		name: "AgentSelect.tsx",
		summary:
			"Dropdown component for selecting an AI agent, rendering preset icons per agent and optionally offering a 'configure agents' navigation action.",
		tags: ["component", "agent-selection", "dropdown"],
		complexity: "moderate",
	},
	"apps/desktop/src/renderer/components/AgentSelect/index.ts": {
		name: "index.ts",
		summary:
			"Barrel re-export for the AgentSelect component and its associated type.",
		tags: ["barrel", "component", "type-definition"],
		complexity: "simple",
	},
	"apps/desktop/src/renderer/components/Chat/ChatInterface/components/ChatInputFooter/components/LinkedIssuePill/LinkedIssuePill.tsx":
		{
			name: "LinkedIssuePill.tsx",
			summary:
				"Renders a clickable pill linking a chat message to a Linear issue, navigating to the linked task or opening the issue URL externally on click.",
			tags: ["component", "chat", "linear-integration", "navigation"],
			complexity: "moderate",
		},
	"apps/desktop/src/renderer/components/Chat/ChatInterface/components/IssueLinkCommand/index.ts":
		{
			name: "index.ts",
			summary: "Barrel re-export for the IssueLinkCommand chat editor command.",
			tags: ["barrel", "chat", "component"],
			complexity: "simple",
		},
	"apps/desktop/src/renderer/components/Chat/components/LinkedTaskChip/LinkedTaskChip.tsx":
		{
			name: "LinkedTaskChip.tsx",
			summary:
				"Renders a chip displaying a linked task's title, resolved via a live query against the tasks collection.",
			tags: ["component", "chat", "live-query", "task-linking"],
			complexity: "simple",
		},
	"apps/desktop/src/renderer/components/MarkdownEditor/components/FileMention/index.ts":
		{
			name: "index.ts",
			summary:
				"Barrel re-export of the file-mention editor node, suggestion component, and related result types for the markdown editor.",
			tags: ["barrel", "markdown-editor", "type-definition"],
			complexity: "simple",
		},
};

const functionNodes = [
	[
		"apps/desktop/src/renderer/assets/app-icons/preset-icons/index.ts",
		"usePresetIcon",
		[11, 15],
		"Hook resolving the preset icon path for a given preset name based on the current theme.",
		["hook", "theme", "icons"],
		"simple",
		true,
	],
	[
		"apps/desktop/src/renderer/assets/app-icons/preset-icons/index.ts",
		"useIsDarkTheme",
		[17, 20],
		"Hook returning whether the resolved theme is currently dark.",
		["hook", "theme"],
		"simple",
		true,
	],

	[
		"apps/desktop/src/renderer/commandPalette/CommandPaletteHost.tsx",
		"CommandPaletteHost",
		[11, 27],
		"Registers all command modules on mount and renders the command context provider plus command palette dialog.",
		["provider", "initialization", "command-palette"],
		"simple",
		true,
	],

	[
		"apps/desktop/src/renderer/commandPalette/core/ContextProvider.tsx",
		"CommandContextProvider",
		[25, 114],
		"Builds and provides the command execution context (route, workspace, project, notification-mute state) consumed by command palette providers.",
		["context-provider", "hook", "command-palette"],
		"complex",
		true,
	],
	[
		"apps/desktop/src/renderer/commandPalette/core/ContextProvider.tsx",
		"useCommandContext",
		[116, 124],
		"Hook for consuming the command context provided by CommandContextProvider.",
		["hook", "context-provider", "command-palette"],
		"simple",
		true,
	],

	[
		"apps/desktop/src/renderer/commandPalette/core/execute.ts",
		"executeCommand",
		[5, 17],
		"Runs a command's action, tracking an analytics event and surfacing a toast if the command throws.",
		["utility", "error-handling", "analytics", "command-palette"],
		"simple",
		true,
	],

	[
		"apps/desktop/src/renderer/commandPalette/core/registry.ts",
		"registerProvider",
		[16, 23],
		"Registers a command provider in the registry and returns an unregister callback, notifying subscribers.",
		["registry", "pub-sub", "command-palette"],
		"simple",
		true,
	],
	[
		"apps/desktop/src/renderer/commandPalette/core/registry.ts",
		"getProviders",
		[25, 27],
		"Returns the current snapshot of registered command providers.",
		["registry", "command-palette"],
		"simple",
		true,
	],
	[
		"apps/desktop/src/renderer/commandPalette/core/registry.ts",
		"subscribeToProviders",
		[29, 34],
		"Subscribes a listener to changes in the command provider registry.",
		["registry", "pub-sub", "command-palette"],
		"simple",
		true,
	],

	[
		"apps/desktop/src/renderer/commandPalette/core/sections.ts",
		"resolveSectionOrder",
		[11, 14],
		"Resolves the ordered list of command palette section labels for the given context.",
		["utility", "command-palette"],
		"simple",
		true,
	],

	[
		"apps/desktop/src/renderer/commandPalette/core/useActiveCommands.ts",
		"useActiveCommands",
		[6, 41],
		"Hook that queries active command providers, filters/dedupes commands by the current context, and groups them into ordered sections.",
		["hook", "command-palette", "state-management"],
		"moderate",
		true,
	],

	[
		"apps/desktop/src/renderer/commandPalette/modules/actions/commands.tsx",
		"cycleTheme",
		[23, 32],
		"Cycles the active theme forward through the built-in theme list.",
		["theme", "action", "command-palette"],
		"simple",
		false,
	],
	[
		"apps/desktop/src/renderer/commandPalette/modules/actions/commands.tsx",
		"toggleNotificationSoundsMuted",
		[34, 43],
		"Toggles the notification sounds muted setting via tRPC and invalidates the related query cache.",
		["settings", "action", "command-palette"],
		"simple",
		false,
	],

	[
		"apps/desktop/src/renderer/commandPalette/modules/index.ts",
		"registerAllModules",
		[7, 17],
		"Registers the actions, navigation, openIn, and workspace command providers with the command registry.",
		["registry", "command-palette", "initialization"],
		"simple",
		true,
	],

	[
		"apps/desktop/src/renderer/commandPalette/modules/openIn/commands.ts",
		"resolvePath",
		[18, 46],
		"Resolves the filesystem path for the active workspace by querying the host service, showing an error toast on failure.",
		["host-service", "utility", "command-palette"],
		"moderate",
		false,
	],
	[
		"apps/desktop/src/renderer/commandPalette/modules/openIn/commands.ts",
		"openIn",
		[48, 69],
		"Opens the resolved workspace path in Finder or an external application via Electron IPC.",
		["external-integration", "command-palette", "action"],
		"moderate",
		false,
	],

	[
		"apps/desktop/src/renderer/commandPalette/modules/settings/commands.ts",
		"tabToCommand",
		[142, 151],
		"Converts a settings tab definition into a navigable command palette command.",
		["settings", "command-palette", "navigation"],
		"simple",
		false,
	],

	[
		"apps/desktop/src/renderer/commandPalette/ui/CommandItemRow/CommandItemRow.tsx",
		"CommandItemRow",
		[10, 33],
		"Renders one selectable command row with icon, label, keyword hints, and formatted hotkey.",
		["component", "command-palette", "list-item"],
		"simple",
		true,
	],

	[
		"apps/desktop/src/renderer/commandPalette/ui/CommandListView/CommandListView.tsx",
		"CommandListView",
		[11, 31],
		"Renders active commands grouped into sections within the command palette list view.",
		["component", "command-palette", "list-view"],
		"simple",
		true,
	],

	[
		"apps/desktop/src/renderer/commandPalette/ui/CommandPalette/CommandPalette.tsx",
		"useCommandPaletteQuery",
		[25, 27],
		"Hook returning the current command palette search query string from context.",
		["hook", "command-palette"],
		"simple",
		true,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/CommandPalette/CommandPalette.tsx",
		"CommandPalette",
		[29, 138],
		"Root command palette dialog managing open/query state, frame stack navigation, keyboard back handling, and command execution.",
		["component", "command-palette", "dialog", "state-management"],
		"complex",
		true,
	],

	[
		"apps/desktop/src/renderer/commandPalette/ui/DeleteWorkspaceMount/DeleteWorkspaceMount.tsx",
		"DeleteWorkspaceMount",
		[5, 25],
		"Headless component that opens the delete-workspace confirmation dialog and closes the command palette when a delete intent is set.",
		["component", "command-palette", "workspace-management"],
		"simple",
		true,
	],

	[
		"apps/desktop/src/renderer/commandPalette/ui/LinkTask/LinkTaskFrame.tsx",
		"LinkTaskFrame",
		[43, 182],
		"Command palette frame for linking the active workspace to a task, combining hybrid search with status/priority-sorted default results.",
		["component", "command-palette", "task-linking", "search"],
		"complex",
		true,
	],

	[
		"apps/desktop/src/renderer/commandPalette/ui/RecentlyViewed/RecentlyViewedFrame.tsx",
		"RecentlyViewedFrame",
		[27, 170],
		"Command palette frame that aggregates and filters recently viewed workspaces, v2 workspaces, automations, and tasks for quick navigation.",
		["component", "command-palette", "recently-viewed", "navigation"],
		"complex",
		true,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/RecentlyViewed/RecentlyViewedFrame.tsx",
		"WorkspaceRow",
		[178, 219],
		"Renders a recently-viewed row for a v1 workspace entry.",
		["component", "command-palette", "list-item"],
		"simple",
		false,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/RecentlyViewed/RecentlyViewedFrame.tsx",
		"V2WorkspaceRow",
		[221, 255],
		"Renders a recently-viewed row for a v2 workspace entry.",
		["component", "command-palette", "list-item"],
		"simple",
		false,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/RecentlyViewed/RecentlyViewedFrame.tsx",
		"AutomationRow",
		[257, 288],
		"Renders a recently-viewed row for an automation entry.",
		["component", "command-palette", "list-item"],
		"simple",
		false,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/RecentlyViewed/RecentlyViewedFrame.tsx",
		"TaskRow",
		[290, 337],
		"Renders a recently-viewed row for a task entry, including its status icon.",
		["component", "command-palette", "list-item"],
		"moderate",
		false,
	],

	[
		"apps/desktop/src/renderer/commandPalette/ui/RemoveFromSidebarMount/RemoveFromSidebarMount.tsx",
		"RemoveFromSidebarMount",
		[14, 32],
		"Headless component that navigates away from and hides a workspace in the sidebar when the remove intent is set.",
		["component", "command-palette", "sidebar", "workspace-management"],
		"simple",
		true,
	],

	[
		"apps/desktop/src/renderer/commandPalette/ui/SetPreferredOpenInAppMount/SetPreferredOpenInAppMount.tsx",
		"SetPreferredOpenInAppMount",
		[6, 24],
		"Headless component that persists the user's preferred 'open in' app for a project and ensures it stays visible in the sidebar.",
		["component", "command-palette", "preferences", "sidebar"],
		"simple",
		true,
	],

	[
		"apps/desktop/src/renderer/commandPalette/ui/SubPaletteView/SubPaletteView.tsx",
		"SubPaletteView",
		[12, 41],
		"Renders the visible child commands of a parent command as a sub-palette list.",
		["component", "command-palette", "navigation"],
		"simple",
		true,
	],

	[
		"apps/desktop/src/renderer/commandPalette/ui/ThemeFrame/ThemeFrame.tsx",
		"ThemeFrame",
		[31, 128],
		"Command palette frame for searching, previewing, and selecting light/dark/system themes.",
		["component", "command-palette", "theme", "search"],
		"complex",
		true,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/ThemeFrame/ThemeFrame.tsx",
		"ThemeGroup",
		[147, 166],
		"Renders a labeled group of theme options with swatches for selection.",
		["component", "command-palette", "theme"],
		"simple",
		false,
	],

	[
		"apps/desktop/src/renderer/commandPalette/ui/WorkspaceList/WorkspaceListFrame.tsx",
		"matchesQuery",
		[40, 51],
		"Checks whether a workspace's name, branch, or project name matches the search query.",
		["utility", "search", "workspace-management"],
		"simple",
		false,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/WorkspaceList/WorkspaceListFrame.tsx",
		"WorkspaceListFrame",
		[53, 63],
		"Selects between the v1 and v2 workspace list implementations based on cloud-enablement.",
		["component", "command-palette", "workspace-management"],
		"simple",
		true,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/WorkspaceList/WorkspaceListFrame.tsx",
		"V1WorkspaceList",
		[65, 134],
		"Renders the v1 workspace list grouped by project with search filtering and navigation.",
		["component", "command-palette", "workspace-management", "search"],
		"moderate",
		false,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/WorkspaceList/WorkspaceListFrame.tsx",
		"V2WorkspaceList",
		[136, 210],
		"Renders the v2 workspace list grouped by project for accessible workspaces with search filtering and navigation.",
		["component", "command-palette", "workspace-management", "search"],
		"moderate",
		false,
	],

	[
		"apps/desktop/src/renderer/components/AgentSelect/AgentSelect.tsx",
		"AgentSelect",
		[40, 105],
		"Dropdown for selecting an agent from a list, rendering preset icons and optionally offering a 'configure agents' navigation option.",
		["component", "agent-selection", "dropdown"],
		"moderate",
		true,
	],

	[
		"apps/desktop/src/renderer/components/Chat/ChatInterface/components/ChatInputFooter/components/LinkedIssuePill/LinkedIssuePill.tsx",
		"LinkedIssuePill",
		[15, 92],
		"Renders a pill linking a chat message to a Linear issue, navigating to the linked task or opening the issue URL externally on click.",
		["component", "chat", "linear-integration", "navigation"],
		"moderate",
		true,
	],

	[
		"apps/desktop/src/renderer/components/Chat/components/LinkedTaskChip/LinkedTaskChip.tsx",
		"LinkedTaskChip",
		[10, 40],
		"Renders a chip displaying a linked task's title fetched via a live query.",
		["component", "chat", "live-query"],
		"simple",
		true,
	],
];

const importData = {
	"apps/desktop/src/renderer/assets/app-icons/preset-icons/index.ts": [
		"apps/desktop/src/renderer/stores/theme/store.ts",
	],
	"apps/desktop/src/renderer/commandPalette/CommandPaletteHost.tsx": [
		"apps/desktop/src/renderer/commandPalette/core/ContextProvider.tsx",
		"apps/desktop/src/renderer/commandPalette/core/frames.ts",
		"apps/desktop/src/renderer/commandPalette/modules/index.ts",
		"apps/desktop/src/renderer/commandPalette/ui/CommandPalette/CommandPalette.tsx",
		"apps/desktop/src/renderer/commandPalette/ui/DeleteWorkspaceMount/DeleteWorkspaceMount.tsx",
		"apps/desktop/src/renderer/commandPalette/ui/RemoveFromSidebarMount/RemoveFromSidebarMount.tsx",
		"apps/desktop/src/renderer/commandPalette/ui/SetPreferredOpenInAppMount/SetPreferredOpenInAppMount.tsx",
		"apps/desktop/src/renderer/hotkeys/index.ts",
	],
	"apps/desktop/src/renderer/commandPalette/core/ContextProvider.tsx": [
		"apps/desktop/src/renderer/commandPalette/core/types.ts",
		"apps/desktop/src/renderer/lib/electron-trpc.ts",
		"apps/desktop/src/renderer/routes/_authenticated/providers/CollectionsProvider/index.ts",
		"apps/desktop/src/renderer/routes/_authenticated/providers/HostWorkspacesProvider/index.ts",
		"apps/desktop/src/renderer/routes/_authenticated/providers/LocalHostServiceProvider/index.ts",
		"apps/desktop/src/renderer/utils/getV2WorkspaceDisplayName/index.ts",
	],
	"apps/desktop/src/renderer/commandPalette/core/execute.ts": [
		"apps/desktop/src/renderer/commandPalette/core/types.ts",
		"apps/desktop/src/renderer/lib/analytics/index.ts",
	],
	"apps/desktop/src/renderer/commandPalette/core/frames.ts": [
		"apps/desktop/src/renderer/commandPalette/core/types.ts",
		"apps/desktop/src/renderer/lib/analytics/index.ts",
	],
	"apps/desktop/src/renderer/commandPalette/core/registry.ts": [
		"apps/desktop/src/renderer/commandPalette/core/types.ts",
	],
	"apps/desktop/src/renderer/commandPalette/core/sections.ts": [
		"apps/desktop/src/renderer/commandPalette/core/types.ts",
	],
	"apps/desktop/src/renderer/commandPalette/core/types.ts": [
		"apps/desktop/src/renderer/hotkeys/registry.ts",
		"apps/desktop/src/renderer/lib/host-service-unavailable.ts",
	],
	"apps/desktop/src/renderer/commandPalette/core/useActiveCommands.ts": [
		"apps/desktop/src/renderer/commandPalette/core/registry.ts",
		"apps/desktop/src/renderer/commandPalette/core/sections.ts",
		"apps/desktop/src/renderer/commandPalette/core/types.ts",
	],
	"apps/desktop/src/renderer/commandPalette/modules/actions/commands.tsx": [
		"apps/desktop/src/renderer/commandPalette/core/types.ts",
		"apps/desktop/src/renderer/commandPalette/ui/ThemeFrame/ThemeFrame.tsx",
		"apps/desktop/src/renderer/env.renderer.ts",
		"apps/desktop/src/renderer/lib/trpc-client.ts",
		"apps/desktop/src/renderer/providers/ElectronTRPCProvider/index.ts",
		"apps/desktop/src/renderer/stores/right-sidebar-toggle-intent.ts",
		"apps/desktop/src/renderer/stores/theme/store.ts",
		"apps/desktop/src/renderer/stores/workspace-sidebar-state.ts",
	],
	"apps/desktop/src/renderer/commandPalette/modules/index.ts": [
		"apps/desktop/src/renderer/commandPalette/core/registry.ts",
		"apps/desktop/src/renderer/commandPalette/modules/actions/commands.tsx",
		"apps/desktop/src/renderer/commandPalette/modules/navigation/commands.tsx",
		"apps/desktop/src/renderer/commandPalette/modules/openIn/commands.ts",
		"apps/desktop/src/renderer/commandPalette/modules/workspace/commands.tsx",
	],
	"apps/desktop/src/renderer/commandPalette/modules/navigation/commands.tsx": [
		"apps/desktop/src/renderer/commandPalette/core/types.ts",
		"apps/desktop/src/renderer/commandPalette/modules/settings/commands.ts",
		"apps/desktop/src/renderer/commandPalette/ui/RecentlyViewed/RecentlyViewedFrame.tsx",
		"apps/desktop/src/renderer/commandPalette/ui/WorkspaceList/index.ts",
	],
	"apps/desktop/src/renderer/commandPalette/modules/openIn/commands.ts": [
		"apps/desktop/src/renderer/commandPalette/core/types.ts",
		"apps/desktop/src/renderer/components/OpenInExternalDropdown/constants.ts",
		"apps/desktop/src/renderer/lib/host-service-client.ts",
		"apps/desktop/src/renderer/lib/host-service-unavailable.ts",
		"apps/desktop/src/renderer/lib/trpc-client.ts",
		"apps/desktop/src/renderer/stores/set-preferred-open-in-app-intent.ts",
	],
	"apps/desktop/src/renderer/commandPalette/modules/settings/commands.ts": [
		"apps/desktop/src/renderer/commandPalette/core/types.ts",
	],
	"apps/desktop/src/renderer/commandPalette/modules/workspace/commands.tsx": [
		"apps/desktop/src/renderer/commandPalette/core/types.ts",
		"apps/desktop/src/renderer/commandPalette/ui/LinkTask/LinkTaskFrame.tsx",
		"apps/desktop/src/renderer/commandPalette/ui/QuickOpen/quickOpenStore.ts",
		"apps/desktop/src/renderer/stores/delete-workspace-intent.ts",
		"apps/desktop/src/renderer/stores/new-workspace-modal.ts",
		"apps/desktop/src/renderer/stores/remove-workspace-from-sidebar-intent.ts",
	],
	"apps/desktop/src/renderer/commandPalette/ui/CommandItemRow/CommandItemRow.tsx":
		[
			"apps/desktop/src/renderer/commandPalette/core/types.ts",
			"apps/desktop/src/renderer/hotkeys/hooks/useHotkeyDisplay/index.ts",
		],
	"apps/desktop/src/renderer/commandPalette/ui/CommandListView/CommandListView.tsx":
		[
			"apps/desktop/src/renderer/commandPalette/core/ContextProvider.tsx",
			"apps/desktop/src/renderer/commandPalette/core/types.ts",
			"apps/desktop/src/renderer/commandPalette/core/useActiveCommands.ts",
			"apps/desktop/src/renderer/commandPalette/ui/CommandItemRow/CommandItemRow.tsx",
		],
	"apps/desktop/src/renderer/commandPalette/ui/CommandPalette/CommandPalette.tsx":
		[
			"apps/desktop/src/renderer/commandPalette/core/ContextProvider.tsx",
			"apps/desktop/src/renderer/commandPalette/core/execute.ts",
			"apps/desktop/src/renderer/commandPalette/core/frames.ts",
			"apps/desktop/src/renderer/commandPalette/core/types.ts",
			"apps/desktop/src/renderer/commandPalette/ui/CommandListView/CommandListView.tsx",
			"apps/desktop/src/renderer/commandPalette/ui/SubPaletteView/SubPaletteView.tsx",
		],
	"apps/desktop/src/renderer/commandPalette/ui/DeleteWorkspaceMount/DeleteWorkspaceMount.tsx":
		[
			"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/DashboardSidebarDeleteDialog/index.ts",
			"apps/desktop/src/renderer/stores/delete-workspace-intent.ts",
		],
	"apps/desktop/src/renderer/commandPalette/ui/LinkTask/LinkTaskFrame.tsx": [
		"apps/desktop/src/renderer/commandPalette/core/frames.ts",
		"apps/desktop/src/renderer/commandPalette/ui/CommandPalette/CommandPalette.tsx",
		"apps/desktop/src/renderer/routes/_authenticated/_dashboard/tasks/components/TasksView/components/shared/StatusIcon/index.ts",
		"apps/desktop/src/renderer/routes/_authenticated/_dashboard/tasks/components/TasksView/hooks/useHybridSearch/index.ts",
		"apps/desktop/src/renderer/routes/_authenticated/hooks/useOptimisticCollectionActions/useOptimisticCollectionActions.ts",
		"apps/desktop/src/renderer/routes/_authenticated/providers/CollectionsProvider/index.ts",
	],
	"apps/desktop/src/renderer/commandPalette/ui/QuickOpen/quickOpenStore.ts": [],
	"apps/desktop/src/renderer/commandPalette/ui/RecentlyViewed/RecentlyViewedFrame.tsx":
		[
			"apps/desktop/src/renderer/commandPalette/core/frames.ts",
			"apps/desktop/src/renderer/hooks/useIsV2CloudEnabled.ts",
			"apps/desktop/src/renderer/lib/electron-trpc.ts",
			"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/NavigationControls/components/HistoryDropdown/hooks/useRecentlyViewed/index.ts",
			"apps/desktop/src/renderer/routes/_authenticated/_dashboard/tasks/components/TasksView/components/shared/StatusIcon/index.ts",
			"apps/desktop/src/renderer/routes/_authenticated/providers/CollectionsProvider/index.ts",
			"apps/desktop/src/renderer/routes/_authenticated/providers/HostWorkspacesProvider/index.ts",
		],
	"apps/desktop/src/renderer/commandPalette/ui/RemoveFromSidebarMount/RemoveFromSidebarMount.tsx":
		[
			"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/hooks/useNavigateAwayFromWorkspace/index.ts",
			"apps/desktop/src/renderer/routes/_authenticated/hooks/useDashboardSidebarState/index.ts",
			"apps/desktop/src/renderer/stores/remove-workspace-from-sidebar-intent.ts",
		],
	"apps/desktop/src/renderer/commandPalette/ui/SetPreferredOpenInAppMount/SetPreferredOpenInAppMount.tsx":
		[
			"apps/desktop/src/renderer/routes/_authenticated/hooks/useDashboardSidebarState/index.ts",
			"apps/desktop/src/renderer/routes/_authenticated/providers/CollectionsProvider/index.ts",
			"apps/desktop/src/renderer/stores/set-preferred-open-in-app-intent.ts",
		],
	"apps/desktop/src/renderer/commandPalette/ui/SubPaletteView/SubPaletteView.tsx":
		[
			"apps/desktop/src/renderer/commandPalette/core/ContextProvider.tsx",
			"apps/desktop/src/renderer/commandPalette/core/types.ts",
			"apps/desktop/src/renderer/commandPalette/ui/CommandItemRow/CommandItemRow.tsx",
		],
	"apps/desktop/src/renderer/commandPalette/ui/ThemeFrame/ThemeFrame.tsx": [
		"apps/desktop/src/renderer/commandPalette/core/frames.ts",
		"apps/desktop/src/renderer/commandPalette/ui/CommandPalette/CommandPalette.tsx",
		"apps/desktop/src/renderer/components/ThemeSwatch/index.ts",
		"apps/desktop/src/renderer/stores/index.ts",
		"apps/desktop/src/shared/themes/index.ts",
	],
	"apps/desktop/src/renderer/commandPalette/ui/WorkspaceList/WorkspaceListFrame.tsx":
		[
			"apps/desktop/src/renderer/commandPalette/core/frames.ts",
			"apps/desktop/src/renderer/commandPalette/ui/CommandPalette/CommandPalette.tsx",
			"apps/desktop/src/renderer/hooks/useIsV2CloudEnabled.ts",
			"apps/desktop/src/renderer/lib/electron-trpc.ts",
			"apps/desktop/src/renderer/routes/_authenticated/_dashboard/utils/workspace-navigation.ts",
			"apps/desktop/src/renderer/routes/_authenticated/_dashboard/v2-workspaces/hooks/useAccessibleV2Workspaces/index.ts",
			"apps/desktop/src/renderer/utils/getV2WorkspaceDisplayName/index.ts",
		],
	"apps/desktop/src/renderer/commandPalette/ui/WorkspaceList/index.ts": [],
	"apps/desktop/src/renderer/components/AgentModelSelect/index.ts": [],
	"apps/desktop/src/renderer/components/AgentSelect/AgentSelect.tsx": [
		"apps/desktop/src/renderer/assets/app-icons/preset-icons/index.ts",
	],
	"apps/desktop/src/renderer/components/AgentSelect/index.ts": [],
	"apps/desktop/src/renderer/components/Chat/ChatInterface/components/ChatInputFooter/components/LinkedIssuePill/LinkedIssuePill.tsx":
		["apps/desktop/src/renderer/components/icons/LinearIcon/index.ts"],
	"apps/desktop/src/renderer/components/Chat/ChatInterface/components/IssueLinkCommand/index.ts":
		[],
	"apps/desktop/src/renderer/components/Chat/components/LinkedTaskChip/LinkedTaskChip.tsx":
		[
			"apps/desktop/src/renderer/components/icons/LinearIcon/index.ts",
			"apps/desktop/src/renderer/routes/_authenticated/providers/CollectionsProvider/index.ts",
		],
	"apps/desktop/src/renderer/components/MarkdownEditor/components/FileMention/index.ts":
		[],
};

// extra calls/depends_on edges: [sourceFile, sourceFunc, type, targetId, weight]
const extraEdges = [
	[
		"apps/desktop/src/renderer/commandPalette/core/ContextProvider.tsx",
		"CommandContextProvider",
		"depends_on",
		"file:apps/desktop/src/renderer/routes/_authenticated/providers/CollectionsProvider/index.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/core/ContextProvider.tsx",
		"CommandContextProvider",
		"depends_on",
		"file:apps/desktop/src/renderer/routes/_authenticated/providers/HostWorkspacesProvider/index.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/core/ContextProvider.tsx",
		"CommandContextProvider",
		"depends_on",
		"file:apps/desktop/src/renderer/routes/_authenticated/providers/LocalHostServiceProvider/index.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/core/ContextProvider.tsx",
		"CommandContextProvider",
		"depends_on",
		"file:apps/desktop/src/renderer/utils/getV2WorkspaceDisplayName/index.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/core/ContextProvider.tsx",
		"CommandContextProvider",
		"depends_on",
		"file:apps/desktop/src/renderer/lib/electron-trpc.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/CommandPaletteHost.tsx",
		"CommandPaletteHost",
		"depends_on",
		"file:apps/desktop/src/renderer/hotkeys/index.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/core/useActiveCommands.ts",
		"useActiveCommands",
		"calls",
		"function:apps/desktop/src/renderer/commandPalette/core/sections.ts:resolveSectionOrder",
		0.8,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/CommandListView/CommandListView.tsx",
		"CommandListView",
		"calls",
		"function:apps/desktop/src/renderer/commandPalette/core/ContextProvider.tsx:useCommandContext",
		0.8,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/CommandListView/CommandListView.tsx",
		"CommandListView",
		"calls",
		"function:apps/desktop/src/renderer/commandPalette/core/useActiveCommands.ts:useActiveCommands",
		0.8,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/CommandPalette/CommandPalette.tsx",
		"CommandPalette",
		"calls",
		"function:apps/desktop/src/renderer/commandPalette/core/ContextProvider.tsx:useCommandContext",
		0.8,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/CommandPalette/CommandPalette.tsx",
		"CommandPalette",
		"calls",
		"function:apps/desktop/src/renderer/commandPalette/core/execute.ts:executeCommand",
		0.8,
	],

	[
		"apps/desktop/src/renderer/commandPalette/ui/DeleteWorkspaceMount/DeleteWorkspaceMount.tsx",
		"DeleteWorkspaceMount",
		"depends_on",
		"file:apps/desktop/src/renderer/stores/delete-workspace-intent.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/LinkTask/LinkTaskFrame.tsx",
		"LinkTaskFrame",
		"depends_on",
		"file:apps/desktop/src/renderer/routes/_authenticated/providers/CollectionsProvider/index.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/LinkTask/LinkTaskFrame.tsx",
		"LinkTaskFrame",
		"depends_on",
		"file:apps/desktop/src/renderer/routes/_authenticated/hooks/useOptimisticCollectionActions/useOptimisticCollectionActions.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/LinkTask/LinkTaskFrame.tsx",
		"LinkTaskFrame",
		"depends_on",
		"file:apps/desktop/src/renderer/routes/_authenticated/_dashboard/tasks/components/TasksView/hooks/useHybridSearch/index.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/RecentlyViewed/RecentlyViewedFrame.tsx",
		"RecentlyViewedFrame",
		"depends_on",
		"file:apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/NavigationControls/components/HistoryDropdown/hooks/useRecentlyViewed/index.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/RecentlyViewed/RecentlyViewedFrame.tsx",
		"RecentlyViewedFrame",
		"depends_on",
		"file:apps/desktop/src/renderer/routes/_authenticated/providers/CollectionsProvider/index.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/RecentlyViewed/RecentlyViewedFrame.tsx",
		"RecentlyViewedFrame",
		"depends_on",
		"file:apps/desktop/src/renderer/routes/_authenticated/providers/HostWorkspacesProvider/index.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/RecentlyViewed/RecentlyViewedFrame.tsx",
		"RecentlyViewedFrame",
		"depends_on",
		"file:apps/desktop/src/renderer/hooks/useIsV2CloudEnabled.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/RemoveFromSidebarMount/RemoveFromSidebarMount.tsx",
		"RemoveFromSidebarMount",
		"depends_on",
		"file:apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/hooks/useNavigateAwayFromWorkspace/index.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/RemoveFromSidebarMount/RemoveFromSidebarMount.tsx",
		"RemoveFromSidebarMount",
		"depends_on",
		"file:apps/desktop/src/renderer/routes/_authenticated/hooks/useDashboardSidebarState/index.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/SetPreferredOpenInAppMount/SetPreferredOpenInAppMount.tsx",
		"SetPreferredOpenInAppMount",
		"depends_on",
		"file:apps/desktop/src/renderer/routes/_authenticated/hooks/useDashboardSidebarState/index.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/SetPreferredOpenInAppMount/SetPreferredOpenInAppMount.tsx",
		"SetPreferredOpenInAppMount",
		"depends_on",
		"file:apps/desktop/src/renderer/routes/_authenticated/providers/CollectionsProvider/index.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/SubPaletteView/SubPaletteView.tsx",
		"SubPaletteView",
		"calls",
		"function:apps/desktop/src/renderer/commandPalette/core/ContextProvider.tsx:useCommandContext",
		0.8,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/ThemeFrame/ThemeFrame.tsx",
		"ThemeFrame",
		"depends_on",
		"file:apps/desktop/src/renderer/stores/theme/store.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/ThemeFrame/ThemeFrame.tsx",
		"ThemeFrame",
		"calls",
		"function:apps/desktop/src/renderer/commandPalette/ui/CommandPalette/CommandPalette.tsx:useCommandPaletteQuery",
		0.8,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/WorkspaceList/WorkspaceListFrame.tsx",
		"WorkspaceListFrame",
		"depends_on",
		"file:apps/desktop/src/renderer/hooks/useIsV2CloudEnabled.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/WorkspaceList/WorkspaceListFrame.tsx",
		"V2WorkspaceList",
		"depends_on",
		"file:apps/desktop/src/renderer/routes/_authenticated/_dashboard/v2-workspaces/hooks/useAccessibleV2Workspaces/index.ts",
		0.6,
	],
	[
		"apps/desktop/src/renderer/commandPalette/ui/WorkspaceList/WorkspaceListFrame.tsx",
		"WorkspaceListFrame",
		"calls",
		"function:apps/desktop/src/renderer/commandPalette/ui/CommandPalette/CommandPalette.tsx:useCommandPaletteQuery",
		0.8,
	],
	[
		"apps/desktop/src/renderer/components/AgentSelect/AgentSelect.tsx",
		"AgentSelect",
		"calls",
		"function:apps/desktop/src/renderer/assets/app-icons/preset-icons/index.ts:useIsDarkTheme",
		0.8,
	],
	[
		"apps/desktop/src/renderer/components/Chat/components/LinkedTaskChip/LinkedTaskChip.tsx",
		"LinkedTaskChip",
		"depends_on",
		"file:apps/desktop/src/renderer/routes/_authenticated/providers/CollectionsProvider/index.ts",
		0.6,
	],
];

function buildPart(fileList) {
	const nodes = [];
	const edges = [];
	const fileSet = new Set(fileList);

	for (const f of fileList) {
		const meta = fileNodes[f];
		const node = {
			id: `file:${f}`,
			type: "file",
			name: meta.name,
			filePath: f,
			summary: meta.summary,
			tags: meta.tags,
			complexity: meta.complexity,
		};
		if (meta.languageNotes) node.languageNotes = meta.languageNotes;
		nodes.push(node);
	}

	const funcsInPart = functionNodes.filter((fn) => fileSet.has(fn[0]));
	for (const [
		file,
		name,
		lineRange,
		summary,
		tags,
		complexity,
	] of funcsInPart) {
		nodes.push({
			id: `function:${file}:${name}`,
			type: "function",
			name,
			filePath: file,
			lineRange,
			summary,
			tags,
			complexity,
		});
	}

	// contains + exports edges
	for (const [file, name, , , , , isExported] of funcsInPart) {
		edges.push({
			source: `file:${file}`,
			target: `function:${file}:${name}`,
			type: "contains",
			direction: "forward",
			weight: 1.0,
		});
		if (isExported) {
			edges.push({
				source: `file:${file}`,
				target: `function:${file}:${name}`,
				type: "exports",
				direction: "forward",
				weight: 0.8,
			});
		}
	}

	// import edges (1:1 emission)
	for (const f of fileList) {
		const imports = importData[f] || [];
		for (const target of imports) {
			edges.push({
				source: `file:${f}`,
				target: `file:${target}`,
				type: "imports",
				direction: "forward",
				weight: 0.7,
			});
		}
	}

	// extra calls/depends_on edges
	for (const [file, func, type, target, weight] of extraEdges) {
		if (fileSet.has(file)) {
			edges.push({
				source: `function:${file}:${func}`,
				target,
				type,
				direction: "forward",
				weight,
			});
		}
	}

	return { nodes, edges };
}

const part1 = buildPart(files.p1);
const part2 = buildPart(files.p2);

console.log("Part1 nodes:", part1.nodes.length, "edges:", part1.edges.length);
console.log("Part2 nodes:", part2.nodes.length, "edges:", part2.edges.length);

fs.writeFileSync(
	"/Users/wushengyu/Develop/hustle/superset/.ua/intermediate/batch-1-part-1.json",
	JSON.stringify(part1, null, 2),
);
fs.writeFileSync(
	"/Users/wushengyu/Develop/hustle/superset/.ua/intermediate/batch-1-part-2.json",
	JSON.stringify(part2, null, 2),
);
console.log("written");
