import fs from "node:fs";

const UA = "/Users/wushengyu/Develop/hustle/superset/.ua";
const extract = JSON.parse(
	fs.readFileSync(`${UA}/tmp/ua-file-extract-results-5.json`, "utf8"),
);
const input = JSON.parse(
	fs.readFileSync(`${UA}/tmp/ua-file-analyzer-input-5.json`, "utf8"),
);
const importData = input.batchImportData;

// Author-provided per-file metadata: summary, tags, languageNotes(optional)
const fileMeta = {
	"apps/desktop/src/renderer/providers/PostHogProvider/PostHogProvider.tsx": {
		summary:
			"React context provider that lazily initializes PostHog analytics on mount and exposes an initialization-complete flag to children.",
		tags: ["provider", "analytics", "entry-point", "component"],
	},
	"apps/desktop/src/renderer/react-query/projects/index.ts": {
		summary:
			"Barrel file re-exporting project-related React Query hooks and types used across the desktop renderer.",
		tags: ["barrel", "react-query", "projects", "hooks"],
	},
	"apps/desktop/src/renderer/react-query/projects/useFinalizeProjectSetup/useFinalizeProjectSetup.ts":
		{
			summary:
				"Hook that finalizes a newly created project by ensuring its workspace and project entries exist in the sidebar and invalidating the host project list cache.",
			tags: ["hook", "react-query", "projects", "sidebar"],
		},
	"apps/desktop/src/renderer/react-query/projects/useHostProjectIds/index.ts": {
		summary:
			"Barrel re-exporting the host project ID query key builder and hook.",
		tags: ["barrel", "react-query", "projects"],
	},
	"apps/desktop/src/renderer/react-query/projects/useHostProjectIds/useHostProjectIds.ts":
		{
			summary:
				"React Query hook that fetches the list of project IDs known to a given host service, with query key builder helper.",
			tags: ["hook", "react-query", "host-service", "projects"],
		},
	"apps/desktop/src/renderer/react-query/workspaces/useUpdateWorkspace.ts": {
		summary:
			"Mutation hook that updates a workspace via the Electron tRPC bridge and invalidates cached workspace queries on success.",
		tags: ["hook", "react-query", "workspaces", "mutation"],
	},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/$automationId/components/VersionHistorySheet/VersionHistorySheet.tsx":
		{
			summary:
				"Slide-over panel that lists an automation's prompt version history, previews a selected version's content, and lets the user restore it.",
			tags: ["component", "automations", "version-history", "sheet"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/$automationId/components/VersionHistorySheet/components/VersionRow/index.ts":
		{
			summary:
				"Barrel export for the VersionRow list-item component used inside VersionHistorySheet.",
			tags: ["barrel", "automations", "component"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/components/AgentCell/AgentCell.tsx":
		{
			summary:
				"Table cell that resolves and renders the agent preset icon and label assigned to an automation row.",
			tags: ["component", "automations", "table-cell", "agent"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/components/AgentCell/index.ts":
		{
			summary: "Barrel export for the AgentCell component.",
			tags: ["barrel", "automations", "component"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/components/AgentPicker/AgentPicker.tsx":
		{
			summary:
				"Dropdown picker for selecting an AI agent preset for an automation, with an option to navigate to agent configuration.",
			tags: ["component", "automations", "picker", "agent"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/components/AutomationRow/AutomationRow.tsx":
		{
			summary:
				"Table row rendering a single automation's metadata, last-run status, and quick actions (run, view history, delete) with navigation to its detail page.",
			tags: ["component", "automations", "table-row", "actions"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/components/AutomationRow/components/AutomationActionsMenuItems/index.ts":
		{
			summary:
				"Barrel export for the automation row's actions dropdown menu items.",
			tags: ["barrel", "automations", "component"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/components/CellWithIcon/index.ts":
		{
			summary:
				"Barrel export for a generic table cell component that pairs an icon with a label.",
			tags: ["barrel", "component", "table-cell"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/components/ProjectPicker/ProjectPicker.tsx":
		{
			summary:
				"Dropdown picker for choosing the project a new automation should target, listing recently used projects.",
			tags: ["component", "automations", "picker", "projects"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/components/SchedulePicker/SchedulePicker.tsx":
		{
			summary:
				"Form control for configuring an automation's recurrence schedule, translating between RRULE strings and a friendly preset/day/time UI state.",
			tags: ["component", "automations", "scheduling", "rrule"],
			languageNotes:
				"Implements bidirectional RRULE <-> UI-state conversion (stateFromRrule / rruleFromState) to keep the calendar recurrence spec in sync with form controls.",
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/components/TimezonePicker/TimezonePicker.tsx":
		{
			summary:
				"Dropdown picker listing available IANA timezones (via Intl.supportedValuesOf) for configuring an automation's schedule.",
			tags: ["component", "automations", "picker", "timezone"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/components/WorkspacePicker/WorkspacePicker.tsx":
		{
			summary:
				"Dropdown picker for selecting the workspace an automation should run against, sorted by recency and filtered by host/project.",
			tags: ["component", "automations", "picker", "workspaces"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/hooks/useProjectFileSearch/useProjectFileSearch.ts":
		{
			summary:
				"Hook exposing a callback that searches project files on a host service, used to power file-mention autocomplete in automation prompts.",
			tags: ["hook", "automations", "file-search", "host-service"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/hooks/useRecentProjects/useRecentProjects.ts":
		{
			summary:
				"Hook combining live-queried local projects and GitHub repositories into a merged, deduplicated list of recent projects for pickers.",
			tags: ["hook", "automations", "projects", "live-query"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/hooks/useRelayHostTarget/useRelayHostTarget.ts":
		{
			summary:
				"Hook that resolves an alternate relay host target for a workspace when the primary host is unavailable.",
			tags: ["hook", "automations", "host-service", "relay"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/AddRepositoryModals/components/NewProjectModal/NewProjectModal.tsx":
		{
			summary:
				"Modal dialog for creating a new local or cloud project, prompting for a Git URL or folder and finalizing project/workspace setup afterward.",
			tags: ["component", "modal", "projects", "onboarding"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/AddRepositoryModals/hooks/useFolderFirstImport/index.ts":
		{
			summary:
				"Barrel export for the useFolderFirstImport hook and its result type.",
			tags: ["barrel", "hook", "projects"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/AddRepositoryModals/hooks/useFolderFirstImport/useFolderFirstImport.ts":
		{
			summary:
				"Hook orchestrating the folder-first project import flow: selecting a local directory, initializing git if needed, and creating the project via the host service.",
			tags: ["hook", "projects", "import", "host-service"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/DashboardSidebarDeleteDialog/hooks/useDestroyDialogState/useDestroyDialogState.ts":
		{
			summary:
				"Hook managing the confirmation-dialog state and destructive action for deleting a workspace, including navigating away and updating sidebar/user preferences.",
			tags: ["hook", "sidebar", "workspaces", "dialog"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/DashboardSidebarHelpMenu/components/SubmitPromptDialog/SubmitPromptDialog.tsx":
		{
			summary:
				"Dialog allowing a user to submit a prompt idea/feedback via the API tRPC client from the sidebar help menu.",
			tags: ["component", "dialog", "sidebar", "feedback"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/DashboardSidebarPortsList/hooks/useDashboardSidebarPortsData/useDashboardSidebarPortsData.ts":
		{
			summary:
				"Hook that aggregates and groups forwarded port data across visible workspaces for display in the dashboard sidebar's ports list.",
			tags: ["hook", "sidebar", "ports", "host-service"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/DashboardSidebarProjectSection/hooks/useDashboardSidebarProjectSectionActions/useDashboardSidebarProjectSectionActions.ts":
		{
			summary:
				"Hook providing action handlers (rename, collapse, new workspace) for a project section in the dashboard sidebar.",
			tags: ["hook", "sidebar", "projects", "actions"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/DashboardSidebarSection/components/DashboardSidebarSectionContextMenu/index.ts":
		{
			summary:
				"Barrel export for the sidebar section's context-menu dropdown and actions components.",
			tags: ["barrel", "sidebar", "context-menu"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/DashboardSidebarSection/components/DashboardSidebarSectionHeader/index.ts":
		{
			summary: "Barrel export for the sidebar section header component.",
			tags: ["barrel", "sidebar", "component"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/DashboardSidebarSectionRenameContext/index.ts":
		{
			summary:
				"Barrel export for the sidebar section rename context provider and hook, used to coordinate inline-rename UI state across sidebar sections.",
			tags: ["barrel", "sidebar", "context", "rename"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/DashboardSidebarWorkspaceItem/hooks/useDashboardSidebarWorkspaceItemActions/useDashboardSidebarWorkspaceItemActions.ts":
		{
			summary:
				"Hook providing the full set of action handlers (rename, remove, copy link, notifications) for a workspace item in the dashboard sidebar.",
			tags: ["hook", "sidebar", "workspaces", "actions"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/SortableSectionHeader/SortableSectionHeader.tsx":
		{
			summary:
				"Draggable sidebar section header supporting reorder, collapse, rename, and delete actions via a drag handle and context menu.",
			tags: ["component", "sidebar", "drag-and-drop", "section-header"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/V2SetupScriptCard/V2SetupScriptCard.tsx":
		{
			summary:
				"Sidebar card prompting the user to run a V2 project setup script, tracking dismissal state and draft workspace creation.",
			tags: ["component", "sidebar", "onboarding", "card"],
		},
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/hooks/useDashboardSidebarData/buildDashboardSidebarProjects.ts":
		{
			summary:
				"Pure function that assembles the dashboard sidebar's project tree from raw project, section, workspace, and pull-request data.",
			tags: ["utility", "sidebar", "projects", "data-transform"],
		},
};

// Function-node significance: manual curation per file (name -> {export:bool})
// Only include functions we decided meet the significance filter.
const functionMeta = {
	"apps/desktop/src/renderer/providers/PostHogProvider/PostHogProvider.tsx": [
		{
			name: "PostHogProvider",
			exported: true,
			complexity: "simple",
			summary:
				"Initializes PostHog once on mount, tracks the init event, and renders children once ready.",
			tags: ["provider", "analytics", "lifecycle"],
		},
	],
	"apps/desktop/src/renderer/react-query/projects/useFinalizeProjectSetup/useFinalizeProjectSetup.ts":
		[
			{
				name: "useFinalizeProjectSetup",
				exported: true,
				complexity: "simple",
				summary:
					"Returns a callback that ensures a workspace/project pair is present in the sidebar and invalidates the host project list query.",
				tags: ["hook", "react-query", "sidebar"],
			},
		],
	"apps/desktop/src/renderer/react-query/projects/useHostProjectIds/useHostProjectIds.ts":
		[
			{
				name: "hostProjectListQueryKey",
				exported: true,
				complexity: "simple",
				summary:
					"Builds the React Query cache key for a host's project list, scoped by host URL.",
				tags: ["utility", "react-query", "query-key"],
			},
			{
				name: "useHostProjectIds",
				exported: true,
				complexity: "simple",
				summary:
					"Fetches project IDs for a host via the host service client and returns them, warning on failure.",
				tags: ["hook", "react-query", "host-service"],
			},
		],
	"apps/desktop/src/renderer/react-query/workspaces/useUpdateWorkspace.ts": [
		{
			name: "useUpdateWorkspace",
			exported: true,
			complexity: "simple",
			summary:
				"Mutation hook that calls the workspaces.update tRPC procedure and invalidates workspace caches on success.",
			tags: ["hook", "mutation", "workspaces"],
		},
	],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/$automationId/components/VersionHistorySheet/VersionHistorySheet.tsx":
		[
			{
				name: "VersionHistorySheet",
				exported: true,
				complexity: "complex",
				summary:
					"Renders the version-history list and content preview for an automation, and handles restoring a selected version via mutation.",
				tags: ["component", "automations", "sheet"],
			},
		],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/components/AgentCell/AgentCell.tsx":
		[
			{
				name: "AgentCell",
				exported: true,
				complexity: "simple",
				summary:
					"Looks up the agent choice by ID and renders its preset icon and label, or a fallback if not found.",
				tags: ["component", "automations", "agent"],
			},
		],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/components/AgentPicker/AgentPicker.tsx":
		[
			{
				name: "AgentPicker",
				exported: true,
				complexity: "moderate",
				summary:
					"Renders a dropdown of available agent presets for a host, with an entry to navigate to agent settings.",
				tags: ["component", "automations", "picker"],
			},
		],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/components/AutomationRow/AutomationRow.tsx":
		[
			{
				name: "AutomationRow",
				exported: true,
				complexity: "complex",
				summary:
					"Renders an automation's row with owner, project, schedule, last-run status, and an actions dropdown, navigating to detail/history on click.",
				tags: ["component", "automations", "table-row"],
			},
		],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/components/ProjectPicker/ProjectPicker.tsx":
		[
			{
				name: "ProjectPicker",
				exported: true,
				complexity: "moderate",
				summary:
					"Renders a dropdown for choosing among recent projects to attach to a new automation.",
				tags: ["component", "automations", "picker"],
			},
		],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/components/SchedulePicker/SchedulePicker.tsx":
		[
			{
				name: "stateFromRrule",
				exported: false,
				complexity: "simple",
				summary:
					"Parses an RRULE string into the picker's internal preset/day/time state, matching against known presets.",
				tags: ["utility", "rrule", "parsing"],
			},
			{
				name: "rruleFromState",
				exported: false,
				complexity: "simple",
				summary:
					"Serializes the picker's preset/day/time state back into an RRULE string.",
				tags: ["utility", "rrule", "serialization"],
			},
			{
				name: "SchedulePicker",
				exported: true,
				complexity: "moderate",
				summary:
					"Renders preset, weekday, and time controls for editing an automation's recurrence rule, keeping RRULE and UI state in sync.",
				tags: ["component", "automations", "scheduling"],
			},
		],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/components/TimezonePicker/TimezonePicker.tsx":
		[
			{
				name: "TimezonePicker",
				exported: true,
				complexity: "simple",
				summary:
					"Renders a searchable dropdown of IANA timezone names for selecting an automation's timezone.",
				tags: ["component", "automations", "picker"],
			},
		],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/components/WorkspacePicker/WorkspacePicker.tsx":
		[
			{
				name: "WorkspacePicker",
				exported: true,
				complexity: "complex",
				summary:
					"Renders a dropdown of workspaces for a host/project, sorted by recency, for selecting an automation's target workspace.",
				tags: ["component", "automations", "picker", "workspaces"],
			},
		],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/hooks/useProjectFileSearch/useProjectFileSearch.ts":
		[
			{
				name: "useProjectFileSearch",
				exported: true,
				complexity: "simple",
				summary:
					"Returns a callback that queries the host service's filesystem search API and maps results for file-mention autocomplete.",
				tags: ["hook", "file-search", "host-service"],
			},
		],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/hooks/useRecentProjects/useRecentProjects.ts":
		[
			{
				name: "useRecentProjects",
				exported: true,
				complexity: "simple",
				summary:
					"Merges locally-known projects and GitHub repositories via live queries into a single recent-projects list.",
				tags: ["hook", "projects", "live-query"],
			},
		],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/hooks/useRelayHostTarget/useRelayHostTarget.ts":
		[
			{
				name: "useRelayHostTarget",
				exported: true,
				complexity: "simple",
				summary:
					"Finds an alternate host from the workspace's available hosts to use as a relay target.",
				tags: ["hook", "host-service", "relay"],
			},
		],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/AddRepositoryModals/components/NewProjectModal/NewProjectModal.tsx":
		[
			{
				name: "NewProjectModal",
				exported: true,
				complexity: "complex",
				summary:
					"Manages the new-project creation flow (folder select or Git clone), invoking host service APIs and finalizing project setup on success.",
				tags: ["component", "modal", "projects", "onboarding"],
			},
		],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/AddRepositoryModals/hooks/useFolderFirstImport/useFolderFirstImport.ts":
		[
			{
				name: "useFolderFirstImport",
				exported: true,
				complexity: "complex",
				summary:
					"Runs the folder-first import flow: prompts for a directory, optionally initializes git, and creates the project through the host service.",
				tags: ["hook", "projects", "import"],
			},
		],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/DashboardSidebarDeleteDialog/hooks/useDestroyDialogState/useDestroyDialogState.ts":
		[
			{
				name: "useDestroyDialogState",
				exported: true,
				complexity: "complex",
				summary:
					"Manages confirmation state and executes workspace destruction, navigating away and syncing sidebar/user-preference state afterward.",
				tags: ["hook", "workspaces", "dialog"],
			},
		],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/DashboardSidebarHelpMenu/components/SubmitPromptDialog/SubmitPromptDialog.tsx":
		[
			{
				name: "SubmitPromptDialog",
				exported: true,
				complexity: "moderate",
				summary:
					"Renders a dialog form for submitting a prompt idea to the API via tRPC.",
				tags: ["component", "dialog", "feedback"],
			},
		],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/DashboardSidebarPortsList/hooks/useDashboardSidebarPortsData/useDashboardSidebarPortsData.ts":
		[
			{
				name: "useDashboardSidebarPortsData",
				exported: true,
				complexity: "complex",
				summary:
					"Collects forwarded-port data for all visible workspaces from the host service and groups it for the sidebar ports list.",
				tags: ["hook", "ports", "sidebar"],
			},
		],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/DashboardSidebarProjectSection/hooks/useDashboardSidebarProjectSectionActions/useDashboardSidebarProjectSectionActions.ts":
		[
			{
				name: "useDashboardSidebarProjectSectionActions",
				exported: true,
				complexity: "moderate",
				summary:
					"Provides rename, collapse, and new-workspace action handlers for a sidebar project section.",
				tags: ["hook", "sidebar", "actions"],
			},
		],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/DashboardSidebarWorkspaceItem/hooks/useDashboardSidebarWorkspaceItemActions/useDashboardSidebarWorkspaceItemActions.ts":
		[
			{
				name: "useDashboardSidebarWorkspaceItemActions",
				exported: true,
				complexity: "complex",
				summary:
					"Provides rename, remove, copy-link, and notification-related action handlers for a sidebar workspace item.",
				tags: ["hook", "sidebar", "workspaces", "actions"],
			},
		],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/SortableSectionHeader/SortableSectionHeader.tsx":
		[
			{
				name: "SortableSectionHeader",
				exported: true,
				complexity: "moderate",
				summary:
					"Renders a draggable sidebar section header with collapse toggle, rename, and delete via a context menu.",
				tags: ["component", "sidebar", "drag-and-drop"],
			},
		],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/V2SetupScriptCard/V2SetupScriptCard.tsx":
		[
			{
				name: "V2SetupScriptCard",
				exported: true,
				complexity: "moderate",
				summary:
					"Renders a dismissible card prompting the user to run the V2 setup script for a project, tracking dismissal per project.",
				tags: ["component", "sidebar", "onboarding"],
			},
		],
	"apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/hooks/useDashboardSidebarData/buildDashboardSidebarProjects.ts":
		[
			{
				name: "buildDashboardSidebarProjects",
				exported: true,
				complexity: "complex",
				summary:
					"Combines projects, sections, workspaces, and pull-request data into the nested project/workspace tree structure the sidebar renders.",
				tags: ["utility", "sidebar", "data-transform"],
			},
		],
};

function complexityFromLines(n) {
	if (n < 50) return "simple";
	if (n <= 200) return "moderate";
	return "complex";
}

const nodes = [];
const edges = [];

for (const r of extract.results) {
	const path = r.path;
	const meta = fileMeta[path];
	if (!meta) throw new Error(`missing meta for ${path}`);
	const name = path.split("/").pop();
	const fileId = `file:${path}`;
	const fileNode = {
		id: fileId,
		type: "file",
		name,
		filePath: path,
		summary: meta.summary,
		tags: meta.tags,
		complexity: complexityFromLines(r.nonEmptyLines),
	};
	if (meta.languageNotes) fileNode.languageNotes = meta.languageNotes;
	nodes.push(fileNode);

	// imports edges
	const imports = importData[path] || [];
	for (const target of imports) {
		edges.push({
			source: fileId,
			target: `file:${target}`,
			type: "imports",
			direction: "forward",
			weight: 0.7,
		});
	}

	// function nodes
	const fnList = functionMeta[path] || [];
	const fnByName = new Map((r.functions || []).map((f) => [f.name, f]));
	for (const fm of fnList) {
		const struct = fnByName.get(fm.name);
		const fnId = `function:${path}:${fm.name}`;
		const node = {
			id: fnId,
			type: "function",
			name: fm.name,
			filePath: path,
			summary: fm.summary,
			tags: fm.tags,
			complexity: fm.complexity,
		};
		if (struct) node.lineRange = [struct.startLine, struct.endLine];
		nodes.push(node);
		edges.push({
			source: fileId,
			target: fnId,
			type: "contains",
			direction: "forward",
			weight: 1.0,
		});
		if (fm.exported) {
			edges.push({
				source: fileId,
				target: fnId,
				type: "exports",
				direction: "forward",
				weight: 0.8,
			});
		}
	}
}

// Confident in-batch cross-file calls edges
edges.push({
	source:
		"function:apps/desktop/src/renderer/react-query/projects/useFinalizeProjectSetup/useFinalizeProjectSetup.ts:useFinalizeProjectSetup",
	target:
		"function:apps/desktop/src/renderer/react-query/projects/useHostProjectIds/useHostProjectIds.ts:hostProjectListQueryKey",
	type: "calls",
	direction: "forward",
	weight: 0.8,
});
edges.push({
	source:
		"function:apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/AddRepositoryModals/components/NewProjectModal/NewProjectModal.tsx:NewProjectModal",
	target:
		"function:apps/desktop/src/renderer/react-query/projects/useFinalizeProjectSetup/useFinalizeProjectSetup.ts:useFinalizeProjectSetup",
	type: "calls",
	direction: "forward",
	weight: 0.8,
});

console.log("nodeCount", nodes.length, "edgeCount", edges.length);

// Validate: no dangling within-batch-created function refs, imports edges have valid syntax
const nodeIds = new Set(nodes.map((n) => n.id));
for (const e of edges) {
	if (e.type === "calls" || e.type === "contains" || e.type === "exports") {
		if (!nodeIds.has(e.source)) throw new Error(`dangling source ${e.source}`);
		if (
			e.type !== "imports" &&
			(e.type === "contains" || e.type === "exports" || e.type === "calls")
		) {
			if (!nodeIds.has(e.target) && e.type !== "calls")
				throw new Error(`dangling target ${e.target}`);
		}
	}
}

fs.writeFileSync(
	`${UA}/tmp/batch5-full.json`,
	JSON.stringify({ nodes, edges }, null, 2),
);
console.log("written full graph");
