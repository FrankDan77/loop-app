import { toast } from "@superset/ui/sonner";
import { useMatchRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { LOOP_AGENT_ID } from "renderer/hooks/useV2AgentChoices";
import { authClient } from "renderer/lib/auth-client";
import { electronTrpcClient } from "renderer/lib/trpc-client";
import { showWorkspaceAutoNameWarningToast } from "renderer/lib/workspaces/showWorkspaceAutoNameWarningToast";
import { useLocalHostService } from "renderer/routes/_authenticated/providers/LocalHostServiceProvider";
import { useLoopPendingIdeasStore } from "renderer/stores/loop-pending-ideas";
import type { NewWorkspacePromptContextApi } from "renderer/stores/new-workspace-prompt-context";
import { useWorkspaceCreates } from "renderer/stores/workspace-creates";
import { useDashboardNewWorkspaceDraft } from "../../../../../DashboardNewWorkspaceDraftContext";
import type { WorkspaceCreateAgent } from "../../types";
import type { UseUploadAttachmentsApi } from "../useUploadAttachments";
import { resolveNames } from "./resolveNames";

/**
 * Submits a workspace create against the new `workspaces.create` host
 * procedure. Attachment uploads run optimistically through `useUploadAttachments`
 * — submit only blocks on whatever uploads are still in flight, then dispatches
 * the create with the resulting `attachmentIds` on the agent launch sugar.
 */
export function useSubmitWorkspace(
	projectId: string | null,
	selectedAgent: WorkspaceCreateAgent,
	selectedModel: string | null,
	selectedEffort: string | null,
	uploadAttachments: UseUploadAttachmentsApi,
	promptContext: NewWorkspacePromptContextApi,
) {
	const navigate = useNavigate();
	const matchRoute = useMatchRoute();
	const { closeAndResetDraft, draft } = useDashboardNewWorkspaceDraft();
	const { submit } = useWorkspaceCreates();
	const { machineId } = useLocalHostService();
	const { data: session } = authClient.useSession();
	const activeOrganizationId = session?.session?.activeOrganizationId;
	const setPendingLoopIdea = useLoopPendingIdeasStore((s) => s.set);
	const rekeyPendingLoopIdea = useLoopPendingIdeasStore((s) => s.rekey);

	return useCallback(async () => {
		if (!projectId) {
			toast.error("Select a project first");
			return;
		}
		if (!activeOrganizationId) {
			toast.error("No active organization");
			return;
		}

		const hostId = draft.hostId ?? machineId;
		if (!hostId) {
			toast.error("No active host");
			return;
		}

		// Loop drives Claude Code with the desktop-bundled loop plugin, whose
		// on-disk path is only valid on this local machine. Guard prerequisites
		// up front so we fail fast before creating the workspace; the Loop
		// sidebar re-resolves the plugin dir when it launches the terminal.
		const isLoop = selectedAgent === LOOP_AGENT_ID;
		if (isLoop) {
			if (hostId !== machineId) {
				toast.error("Loop is only available on this local machine");
				return;
			}
			try {
				const status = await electronTrpcClient.settings.loopStatus.query();
				if (!status.loopDir) {
					toast.error("Bundled loop plugin not found");
					return;
				}
				if (!status.prereqs.claude) {
					toast.error("Claude Code CLI not found on PATH");
					return;
				}
			} catch (error) {
				toast.error(
					`Failed to resolve loop plugin: ${
						error instanceof Error ? error.message : String(error)
					}`,
				);
				return;
			}
		}

		const { readyIds: attachmentIds, errors } =
			await uploadAttachments.awaitUploads();
		if (errors.length > 0) {
			const first = errors[0];
			toast.error(
				first.filename
					? `Attachment upload failed (${first.filename}): ${first.message}`
					: `Attachment upload failed: ${first.message}`,
			);
			return;
		}

		const { branchName, workspaceName } = resolveNames(draft);

		const isPrCheckout = draft.linkedPR !== null;

		const linkedTaskId = draft.linkedIssues.find(
			(issue) => issue.source === "internal" && issue.taskId,
		)?.taskId;

		const hasAnyContext =
			!!draft.prompt.trim() ||
			draft.linkedPR !== null ||
			draft.linkedIssues.length > 0 ||
			attachmentIds.length > 0;
		const wantAgent = selectedAgent !== "none" && hasAnyContext;
		// Loop drives a raw command terminal (not a host_agent_config), so it
		// never populates the `agents` sugar.
		const wantTerminalAgent = wantAgent && !isLoop;

		const finalPrompt = wantAgent
			? await promptContext.build({
					userPrompt: draft.prompt,
					linkedPR: draft.linkedPR,
					linkedIssues: draft.linkedIssues,
					timeoutMs: 2000,
				})
			: null;

		const agents = wantTerminalAgent
			? [
					{
						agent: selectedAgent,
						prompt: finalPrompt ?? "",
						attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined,
						model: selectedModel ?? undefined,
						effort: selectedEffort ?? undefined,
					},
				]
			: undefined;

		// PR path supplies a name (PR title) so the in-flight UI has
		// something to show immediately. Branch path leaves both `name`
		// and `branch` undefined when the user didn't type — the server
		// generates a friendly random and AI-renames whichever side(s)
		// the user didn't supply.
		const prName = isPrCheckout
			? draft.linkedPR?.title || `PR #${draft.linkedPR?.prNumber}`
			: undefined;

		const trimmedPrompt = draft.prompt.trim();
		const workspaceId = crypto.randomUUID();
		const snapshot = {
			id: workspaceId,
			projectId,
			name: isPrCheckout ? prName : (workspaceName ?? undefined),
			branch: isPrCheckout ? undefined : (branchName ?? undefined),
			pr: isPrCheckout ? draft.linkedPR?.prNumber : undefined,
			baseBranch: draft.baseBranch ?? undefined,
			taskId: linkedTaskId,
			agents,
			// Loop has no `agents` prompt for the server to name from, so pass the
			// idea as namingPrompt (like the no-agent path) to keep AI naming.
			namingPrompt:
				!isPrCheckout && (!wantAgent || isLoop) && trimmedPrompt
					? trimmedPrompt
					: undefined,
		};

		// Loop hands the idea to the workspace's Loop sidebar (keyed by the
		// optimistic id) instead of baking a launch command; the sidebar
		// auto-starts gen-idea → gen-plan when it mounts.
		if (isLoop && trimmedPrompt) {
			setPendingLoopIdea(workspaceId, finalPrompt ?? trimmedPrompt);
		}

		closeAndResetDraft();
		const { completed } = submit({ hostId, snapshot });
		void navigate({
			to: "/v2-workspace/$workspaceId",
			params: { workspaceId },
		}).catch((error) => {
			console.error("[useSubmitWorkspace] failed to open workspace", error);
		});

		const isViewingOptimisticWorkspace = () => {
			const workspaceMatch = matchRoute({
				to: "/v2-workspace/$workspaceId",
			});
			return (
				workspaceMatch !== false && workspaceMatch.workspaceId === workspaceId
			);
		};

		void completed.then((outcome) => {
			if (!outcome.ok) return;

			if (outcome.autoNameWarning) {
				showWorkspaceAutoNameWarningToast({
					description: outcome.autoNameWarning,
					onOpenModelAuthSettings: () => {
						void navigate({ to: "/settings/models" });
					},
				});
			}

			// The server can resolve the optimistic workspace to a different
			// canonical id; follow it only if we're still on the optimistic route.
			if (outcome.workspaceId === workspaceId) return;
			// Move any queued Loop idea to the canonical id so the sidebar still
			// finds it after the redirect.
			rekeyPendingLoopIdea(workspaceId, outcome.workspaceId);
			if (!isViewingOptimisticWorkspace()) return;
			void navigate({
				to: "/v2-workspace/$workspaceId",
				params: { workspaceId: outcome.workspaceId },
				replace: true,
			}).catch((error) => {
				console.error(
					"[useSubmitWorkspace] failed to redirect workspace",
					error,
				);
			});
		});
	}, [
		activeOrganizationId,
		closeAndResetDraft,
		draft,
		matchRoute,
		machineId,
		navigate,
		projectId,
		promptContext,
		selectedAgent,
		selectedModel,
		selectedEffort,
		submit,
		uploadAttachments,
		setPendingLoopIdea,
		rekeyPendingLoopIdea,
	]);
}
