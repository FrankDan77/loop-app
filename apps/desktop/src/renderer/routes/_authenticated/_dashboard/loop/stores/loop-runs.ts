import type { LoopPhase } from "@superset/shared/loop-commands";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LoopRun {
	id: string;
	name: string;
	/** Absolute path to the target git repo the loop runs against. */
	targetDir: string;
	/** The initial requirement / rough idea the user wants to build. */
	requirement: string;
	phase: LoopPhase;
	/** Draft/idea markdown path (relative to targetDir). */
	ideaPath: string;
	/** Plan markdown path (relative to targetDir). */
	planPath: string;
	createdAt: number;
	updatedAt: number;
}

export interface CreateLoopRunInput {
	name: string;
	targetDir: string;
	requirement: string;
}

interface LoopRunsState {
	runs: Record<string, LoopRun>;
	createRun: (input: CreateLoopRunInput) => LoopRun;
	updateRun: (
		id: string,
		patch: Partial<Omit<LoopRun, "id" | "createdAt">>,
	) => void;
	removeRun: (id: string) => void;
}

export const useLoopRunsStore = create<LoopRunsState>()(
	persist(
		(set) => ({
			runs: {},
			createRun: (input) => {
				const now = Date.now();
				const run: LoopRun = {
					id: crypto.randomUUID(),
					name: input.name.trim() || "Untitled loop",
					targetDir: input.targetDir.trim(),
					requirement: input.requirement.trim(),
					phase: "idea",
					ideaPath: "",
					planPath: "docs/plan.md",
					createdAt: now,
					updatedAt: now,
				};
				set((state) => ({ runs: { ...state.runs, [run.id]: run } }));
				return run;
			},
			updateRun: (id, patch) =>
				set((state) => {
					const existing = state.runs[id];
					if (!existing) return state;
					return {
						runs: {
							...state.runs,
							[id]: { ...existing, ...patch, updatedAt: Date.now() },
						},
					};
				}),
			removeRun: (id) =>
				set((state) => {
					const next = { ...state.runs };
					delete next[id];
					return { runs: next };
				}),
		}),
		{ name: "loop-runs", version: 1 },
	),
);

/** Selector helper: runs sorted by most-recently-updated first. */
export function selectSortedLoopRuns(state: LoopRunsState): LoopRun[] {
	return Object.values(state.runs).sort((a, b) => b.updatedAt - a.updatedAt);
}
