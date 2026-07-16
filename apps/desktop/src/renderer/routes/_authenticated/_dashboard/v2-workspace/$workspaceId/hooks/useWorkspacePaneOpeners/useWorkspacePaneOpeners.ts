import type { WorkspaceStore } from "@superset/panes";
import {
	buildLoopClaudeLaunchCommand,
	buildLoopClaudeLaunchWithPrompt,
	buildLoopClaudeResumeCommand,
} from "@superset/shared/loop-commands";
import { toast } from "@superset/ui/sonner";
import { useCallback } from "react";
import { electronTrpcClient } from "renderer/lib/trpc-client";
import type { V2TerminalPresetRow } from "renderer/routes/_authenticated/providers/CollectionsProvider/dashboardSidebarLocal";
import type { StoreApi } from "zustand/vanilla";
import type {
	BrowserPaneData,
	ChatPaneData,
	CommentPaneData,
	DiffFocusSide,
	DiffPaneData,
	PaneViewerData,
	TerminalPaneData,
} from "../../types";
import type { TerminalLauncher } from "../useV2TerminalLauncher";

export function useWorkspacePaneOpeners({
	store,
	launcher,
	newTabPresets,
	executePreset,
}: {
	store: StoreApi<WorkspaceStore<PaneViewerData>>;
	launcher: TerminalLauncher;
	newTabPresets: V2TerminalPresetRow[];
	executePreset: (
		preset: V2TerminalPresetRow,
		options?: { target?: "new-tab" | "active-tab" },
	) => void | Promise<void>;
}): {
	openDiffPane: (
		filePath: string,
		openInNewTab?: boolean,
		line?: number,
		side?: DiffFocusSide,
		changeKey?: string,
	) => void;
	addTerminalTab: () => Promise<void>;
	createLoopTerminal: (options?: {
		initialPrompt?: string;
		resumeSessionId?: string;
	}) => Promise<string | null>;
	addChatTab: () => void;
	addBrowserTab: () => void;
	openCommentPane: (comment: CommentPaneData) => void;
} {
	const openDiffPane = useCallback(
		(
			filePath: string,
			openInNewTab?: boolean,
			line?: number,
			side?: DiffFocusSide,
			changeKey?: string,
		) => {
			const state = store.getState();
			// Bump tick on every request so the scroll effect re-fires on repeat
			// clicks; clear when no line is given so reused panes don't jump
			// to a stale focus.
			const focusFields =
				line != null
					? { focusLine: line, focusSide: side, focusTick: Date.now() }
					: {
							focusLine: undefined,
							focusSide: undefined,
							focusTick: undefined,
						};
			if (openInNewTab) {
				state.addTab({
					panes: [
						{
							kind: "diff",
							data: {
								path: filePath,
								changeKey,
								collapsedFiles: [],
								...focusFields,
							} as DiffPaneData,
						},
					],
				});
				return;
			}
			for (const tab of state.tabs) {
				for (const pane of Object.values(tab.panes)) {
					if (pane.kind !== "diff") continue;
					const prev = pane.data as DiffPaneData;
					state.setPaneData({
						paneId: pane.id,
						data: {
							...prev,
							path: filePath,
							changeKey,
							// Only the navigated file's key can be pruned; without a
							// change key we can't identify it, so leave the set intact.
							collapsedFiles: changeKey
								? (prev.collapsedFiles ?? []).filter((key) => key !== changeKey)
								: (prev.collapsedFiles ?? []),
							...focusFields,
						} as PaneViewerData,
					});
					state.setActiveTab(tab.id);
					state.setActivePane({ tabId: tab.id, paneId: pane.id });
					return;
				}
			}
			state.openPane({
				pane: {
					kind: "diff",
					data: {
						path: filePath,
						changeKey,
						collapsedFiles: [],
						...focusFields,
					} as DiffPaneData,
				},
			});
		},
		[store],
	);

	const addBlankTerminalTab = useCallback(async () => {
		const terminalId = await launcher.create();
		store.getState().addTab({
			panes: [
				{
					kind: "terminal",
					data: { terminalId } as TerminalPaneData,
				},
			],
		});
	}, [store, launcher]);

	const addTerminalTab = useCallback(async () => {
		if (newTabPresets.length === 0) {
			await addBlankTerminalTab();
			return;
		}

		// New terminal tabs are the trigger point for applyOnNewTab presets.
		// Each matching preset owns the tab/pane shape it creates.
		for (const preset of newTabPresets) {
			await executePreset(preset, { target: "new-tab" });
		}
	}, [addBlankTerminalTab, executePreset, newTabPresets]);

	// Launches a dedicated terminal running Claude Code with the vendored loop
	// plugin loaded, scoped to this workspace's worktree (host defaults cwd to
	// the worktree when we omit it). An optional initial prompt (e.g. the
	// gen-idea slash command) is baked as Claude's first prompt so it runs on
	// startup; `resumeSessionId` instead resumes an existing loop's Claude
	// session (`claude --resume`) so injected controls drive the real run.
	// Returns the terminalId so the Loop sidebar can inject follow-up commands;
	// returns null (after toasting) when prerequisites are missing.
	const createLoopTerminal = useCallback(
		async (options?: {
			initialPrompt?: string;
			resumeSessionId?: string;
		}): Promise<string | null> => {
			let loopDir: string | null;
			let hasClaude: boolean;
			try {
				const status = await electronTrpcClient.settings.loopStatus.query();
				loopDir = status.loopDir;
				hasClaude = status.prereqs.claude;
			} catch (error) {
				toast.error(
					`Failed to resolve loop plugin: ${
						error instanceof Error ? error.message : String(error)
					}`,
				);
				return null;
			}

			if (!loopDir) {
				toast.error("Bundled loop plugin not found");
				return null;
			}
			if (!hasClaude) {
				toast.error("Claude Code CLI not found on PATH");
				return null;
			}

			const command = options?.resumeSessionId
				? buildLoopClaudeResumeCommand(
						loopDir,
						options.resumeSessionId,
						options.initialPrompt,
					)
				: options?.initialPrompt
					? buildLoopClaudeLaunchWithPrompt(loopDir, options.initialPrompt)
					: buildLoopClaudeLaunchCommand(loopDir);
			const terminalId = await launcher.create({ command });
			store.getState().addTab({
				panes: [
					{
						kind: "terminal",
						titleOverride: "Loop",
						data: { terminalId } as TerminalPaneData,
					},
				],
			});
			return terminalId;
		},
		[store, launcher],
	);

	const addChatTab = useCallback(() => {
		store.getState().addTab({
			panes: [
				{
					kind: "chat",
					data: { sessionId: null } as ChatPaneData,
				},
			],
		});
	}, [store]);

	const addBrowserTab = useCallback(() => {
		store.getState().addTab({
			panes: [
				{
					kind: "browser",
					data: {
						url: "about:blank",
					} as BrowserPaneData,
				},
			],
		});
	}, [store]);

	const openCommentPane = useCallback(
		(comment: CommentPaneData) => {
			const state = store.getState();
			for (const tab of state.tabs) {
				for (const pane of Object.values(tab.panes)) {
					if (pane.kind !== "comment") continue;
					state.setPaneData({
						paneId: pane.id,
						data: comment as PaneViewerData,
					});
					state.setActiveTab(tab.id);
					state.setActivePane({ tabId: tab.id, paneId: pane.id });
					return;
				}
			}
			state.addTab({
				panes: [
					{
						kind: "comment",
						data: comment as PaneViewerData,
					},
				],
			});
		},
		[store],
	);

	return {
		openDiffPane,
		addTerminalTab,
		createLoopTerminal,
		addChatTab,
		addBrowserTab,
		openCommentPane,
	};
}
