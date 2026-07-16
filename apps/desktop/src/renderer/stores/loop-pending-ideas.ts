import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface LoopPendingIdeasState {
	/** Map of workspaceId → idea text queued by the new-workspace modal. */
	ideas: Record<string, string>;
	/** Queue an idea to auto-start once the workspace's Loop sidebar mounts. */
	set: (workspaceId: string, idea: string) => void;
	/** Read + remove a queued idea (consumed exactly once by the sidebar). */
	take: (workspaceId: string) => string | null;
	/** Re-key a queued idea when the server remaps the optimistic workspaceId. */
	rekey: (fromWorkspaceId: string, toWorkspaceId: string) => void;
}

/**
 * Non-persistent bridge from the new-workspace modal to the workspace Loop
 * sidebar. The modal seeds an idea keyed by the (optimistic) workspaceId
 * instead of baking a launch command; when the workspace opens, the Loop
 * sidebar consumes the idea and drives the gen-idea → gen-plan flow itself.
 * Intentionally in-memory only — a stale idea should never resurface after a
 * reload.
 */
export const useLoopPendingIdeasStore = create<LoopPendingIdeasState>()(
	devtools(
		(set, get) => ({
			ideas: {},
			set: (workspaceId, idea) =>
				set((state) => ({
					ideas: { ...state.ideas, [workspaceId]: idea },
				})),
			take: (workspaceId) => {
				const idea = get().ideas[workspaceId];
				if (idea === undefined) return null;
				set((state) => {
					const { [workspaceId]: _removed, ...rest } = state.ideas;
					return { ideas: rest };
				});
				return idea;
			},
			rekey: (fromWorkspaceId, toWorkspaceId) =>
				set((state) => {
					const idea = state.ideas[fromWorkspaceId];
					if (idea === undefined) return state;
					const { [fromWorkspaceId]: _removed, ...rest } = state.ideas;
					return { ideas: { ...rest, [toWorkspaceId]: idea } };
				}),
		}),
		{ name: "loop-pending-ideas" },
	),
);
