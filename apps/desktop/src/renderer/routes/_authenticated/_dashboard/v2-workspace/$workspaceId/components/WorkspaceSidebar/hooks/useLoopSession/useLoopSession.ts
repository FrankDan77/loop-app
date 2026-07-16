import { eq } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { useCallback } from "react";
import { useCollections } from "renderer/routes/_authenticated/providers/CollectionsProvider";
import {
	DEFAULT_LOOP_SESSION_STATE,
	type LoopSessionState,
} from "renderer/routes/_authenticated/providers/CollectionsProvider/dashboardSidebarLocal";

interface UseLoopSessionResult {
	loopState: LoopSessionState;
	setLoopState: (patch: Partial<LoopSessionState>) => void;
}

/**
 * Reads + patches the workspace-scoped Loop state machine persisted on the
 * `v2WorkspaceLocalState` row. Writes are no-ops until the row exists (it is
 * created when the workspace opens), so callers can fire safely on mount.
 */
export function useLoopSession(workspaceId: string): UseLoopSessionResult {
	const collections = useCollections();
	const { data: [row] = [] } = useLiveQuery(
		(query) =>
			query
				.from({ localState: collections.v2WorkspaceLocalState })
				.where(({ localState }) => eq(localState.workspaceId, workspaceId)),
		[collections, workspaceId],
	);

	const loopState = row?.loopState ?? DEFAULT_LOOP_SESSION_STATE;

	const setLoopState = useCallback(
		(patch: Partial<LoopSessionState>) => {
			if (!collections.v2WorkspaceLocalState.get(workspaceId)) return;
			collections.v2WorkspaceLocalState.update(workspaceId, (draft) => {
				draft.loopState = {
					...DEFAULT_LOOP_SESSION_STATE,
					...draft.loopState,
					...patch,
					updatedAt: Date.now(),
				};
			});
		},
		[collections, workspaceId],
	);

	return { loopState, setLoopState };
}
