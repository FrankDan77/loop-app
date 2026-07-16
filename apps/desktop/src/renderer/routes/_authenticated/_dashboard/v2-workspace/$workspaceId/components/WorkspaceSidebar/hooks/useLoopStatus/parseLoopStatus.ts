/**
 * Pure parsers for the loop plugin's on-disk RLCR state, ported from the
 * shell monitor (`vendor/loop/scripts/loop.sh` + `lib/monitor-common.sh`).
 * The desktop Loop sidebar reads the same files the CLI `loop monitor rlcr`
 * reads and renders them natively.
 *
 * Everything here is string-in / value-out so it stays trivially testable and
 * free of any host-service or React coupling.
 */

/** Terminal + active statuses derived from which `*-state.md` file exists. */
export type LoopRunStatus =
	| "active"
	| "methodology-analysis"
	| "finalize"
	| "complete"
	| "cancel"
	| "maxiter"
	| "stop"
	| "unexpected"
	| "unknown";

const TERMINAL_STATUSES: ReadonlySet<LoopRunStatus> = new Set([
	"complete",
	"cancel",
	"maxiter",
	"stop",
	"unexpected",
]);

export function isTerminalLoopStatus(status: LoopRunStatus): boolean {
	return TERMINAL_STATUSES.has(status);
}

/**
 * Which state file is present, and the status it implies. Mirrors
 * `monitor_find_state_file`: active files win, then `<reason>-state.md`.
 * Returns the state-file basename (to read its frontmatter) or null.
 */
export function detectStatusFromFiles(fileNames: readonly string[]): {
	status: LoopRunStatus;
	stateFileName: string | null;
} {
	const has = (name: string) => fileNames.includes(name);

	if (has("methodology-analysis-state.md")) {
		return {
			status: "methodology-analysis",
			stateFileName: "methodology-analysis-state.md",
		};
	}
	if (has("finalize-state.md")) {
		return { status: "finalize", stateFileName: "finalize-state.md" };
	}
	if (has("state.md")) {
		return { status: "active", stateFileName: "state.md" };
	}

	// Terminal `<reason>-state.md` files, in rough priority order.
	const terminalOrder: Array<[string, LoopRunStatus]> = [
		["complete-state.md", "complete"],
		["cancel-state.md", "cancel"],
		["maxiter-state.md", "maxiter"],
		["stop-state.md", "stop"],
		["unexpected-state.md", "unexpected"],
	];
	for (const [name, status] of terminalOrder) {
		if (has(name)) return { status, stateFileName: name };
	}

	// Fallback: any *-state.md we don't specifically know about.
	const generic = fileNames.find((n) => n.endsWith("-state.md"));
	if (generic) {
		const reason = generic.replace(/-state\.md$/, "");
		const known: Record<string, LoopRunStatus> = {
			complete: "complete",
			cancel: "cancel",
			cancelled: "cancel",
			maxiter: "maxiter",
			stop: "stop",
			unexpected: "unexpected",
		};
		return { status: known[reason] ?? "unknown", stateFileName: generic };
	}

	return { status: "unknown", stateFileName: null };
}

/** Parse YAML frontmatter (between the first two `---` fences) into a map. */
export function parseFrontmatter(md: string): Record<string, string> {
	const lines = md.split(/\r?\n/);
	if (lines[0]?.trim() !== "---") return {};
	const out: Record<string, string> = {};
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i];
		if (line.trim() === "---") break;
		const idx = line.indexOf(":");
		if (idx === -1) continue;
		const key = line.slice(0, idx).trim();
		const value = line
			.slice(idx + 1)
			.trim()
			.replace(/^["']|["']$/g, "");
		if (key) out[key] = value;
	}
	return out;
}

function toNumberOrNull(value: string | undefined): number | null {
	if (value === undefined || value === "") return null;
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}

export interface LoopStateFields {
	currentRound: number | null;
	maxIterations: number | null;
	fullReviewRound: number | null;
	reviewStarted: boolean;
	codexModel: string | null;
	codexEffort: string | null;
	startedAt: string | null;
	planFile: string | null;
	driftStatus: string | null;
	mainlineStallCount: number | null;
	/** Claude Code session id driving the run (backfilled by the plugin hook). */
	sessionId: string | null;
}

export function parseStateFields(md: string): LoopStateFields {
	const fm = parseFrontmatter(md);
	return {
		currentRound: toNumberOrNull(fm.current_round),
		maxIterations: toNumberOrNull(fm.max_iterations),
		fullReviewRound: toNumberOrNull(fm.full_review_round),
		reviewStarted: fm.review_started === "true",
		codexModel: fm.codex_model || null,
		codexEffort: fm.codex_effort || null,
		startedAt: fm.started_at || null,
		planFile: fm.plan_file || null,
		driftStatus: fm.drift_status || null,
		mainlineStallCount: toNumberOrNull(fm.mainline_stall_count),
		sessionId: fm.session_id || null,
	};
}

/** Grab the body between a start heading and the next matching stop line. */
function sliceSection(
	lines: readonly string[],
	startRe: RegExp,
	stopRe: RegExp,
): string[] {
	const startIdx = lines.findIndex((l) => startRe.test(l));
	if (startIdx === -1) return [];
	const body: string[] = [];
	for (let i = startIdx + 1; i < lines.length; i++) {
		if (stopRe.test(lines[i])) break;
		body.push(lines[i]);
	}
	return body;
}

function countTableDataRows(sectionLines: readonly string[]): number {
	const rows = sectionLines.filter((l) => l.trimStart().startsWith("|")).length;
	return rows > 2 ? rows - 2 : 0;
}

function countUniqueAcs(sectionLines: readonly string[]): number {
	const ids = new Set<string>();
	const re = /AC-?\d+(?:\.\d+)?/g;
	for (const line of sectionLines) {
		for (const match of line.matchAll(re)) ids.add(match[0].replace("-", ""));
	}
	return ids.size;
}

/** Split a markdown table row `| a | b |` into trimmed cells. */
function splitTableRow(line: string): string[] {
	let s = line.trim();
	if (s.startsWith("|")) s = s.slice(1);
	if (s.endsWith("|")) s = s.slice(0, -1);
	return s.split("|").map((c) => c.trim());
}

/** A `|---|---|` header separator row (dashes, optional alignment colons). */
function isSeparatorRow(cells: readonly string[]): boolean {
	return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
}

/**
 * Parse a markdown table found inside a section into records keyed by header
 * name. Robust to column-count variants (reads by header name, not position)
 * and to leading text before the table. Returns [] when there's no table.
 */
export function parseMarkdownTable(
	sectionLines: readonly string[],
): Array<Record<string, string>> {
	const rows = sectionLines.filter((l) => l.trimStart().startsWith("|"));
	if (rows.length < 1) return [];
	const header = splitTableRow(rows[0]);
	const out: Array<Record<string, string>> = [];
	for (let i = 1; i < rows.length; i++) {
		const cells = splitTableRow(rows[i]);
		if (isSeparatorRow(cells)) continue;
		const record: Record<string, string> = {};
		header.forEach((name, idx) => {
			if (name) record[name] = cells[idx] ?? "";
		});
		out.push(record);
	}
	return out;
}

/** Per-criterion status, highest-priority first: verified > blocked > in_progress > pending. */
export type AcStatus = "verified" | "blocked" | "in_progress" | "pending";

export interface AcItem {
	/** Normalized id, e.g. `AC-1`. */
	id: string;
	/** Criterion text (best-effort from the Acceptance Criteria section). */
	text: string;
	status: AcStatus;
	/** Round in which Codex verified it (from Completed and Verified). */
	verifiedRound: number | null;
	/** Evidence note recorded when verified. */
	evidence: string | null;
	/** Issue title blocking this criterion (from Blocking Side Issues). */
	blockingIssue: string | null;
	/** Active task titles that target this criterion. */
	tasks: string[];
}

/** Normalize any `AC-1` / `AC1` / `ac 1` spelling to canonical `AC-1`. */
function normalizeAcId(raw: string): string | null {
	const m = raw.match(/AC-?\s*(\d+(?:\.\d+)?)/i);
	return m ? `AC-${m[1]}` : null;
}

/** All distinct normalized AC ids referenced anywhere in a cell/line. */
function acIdsIn(text: string): string[] {
	const ids: string[] = [];
	for (const match of text.matchAll(/AC-?\s*\d+(?:\.\d+)?/gi)) {
		const id = normalizeAcId(match[0]);
		if (id && !ids.includes(id)) ids.push(id);
	}
	return ids;
}

const isSkippableAcLine = (line: string): boolean =>
	line.length === 0 ||
	line.startsWith("<!--") ||
	line.startsWith("#") ||
	line.startsWith("[To be") ||
	line.startsWith("---");

/** Extract the defined criteria (id + text) from the Acceptance Criteria body. */
function extractAcDefinitions(
	acSection: readonly string[],
): Array<{ id: string; text: string }> {
	const seen = new Set<string>();
	const defs: Array<{ id: string; text: string }> = [];

	// Table style: `| AC-1 | text | ... |`.
	const table = parseMarkdownTable(acSection);
	for (const row of table) {
		const entries = Object.entries(row);
		const idEntry = entries.find(([, v]) => normalizeAcId(v));
		if (!idEntry) continue;
		const id = normalizeAcId(idEntry[1]);
		if (!id || seen.has(id)) continue;
		const text =
			entries
				.filter(([k]) => k !== idEntry[0])
				.map(([, v]) => v)
				.filter((v) => v.length > 0)
				.join(" — ") || id;
		seen.add(id);
		defs.push({ id, text });
	}
	if (defs.length > 0) return defs;

	// Bullet / line style: `- AC-1: text`, `**AC-1** text`, `1. AC-1 ...`.
	for (const raw of acSection) {
		const line = raw.trim();
		if (isSkippableAcLine(line) || line.startsWith("|")) continue;
		const m = line.match(
			/\*{0,2}(AC-?\s*\d+(?:\.\d+)?)\*{0,2}\s*[:.)-]?\s*(.*)$/i,
		);
		if (!m) continue;
		const id = normalizeAcId(m[1]);
		if (!id || seen.has(id)) continue;
		seen.add(id);
		defs.push({ id, text: m[2].trim() || id });
	}
	if (defs.length > 0) return defs;

	// Fallback: no explicit AC ids — synthesize AC-1..N from bullet lines.
	let n = 0;
	for (const raw of acSection) {
		const line = raw.trim();
		if (isSkippableAcLine(line) || line.startsWith("|")) continue;
		const text = line
			.replace(/^[-*]\s+/, "")
			.replace(/^\d+\.\s+/, "")
			.trim();
		if (!text) continue;
		n += 1;
		defs.push({ id: `AC-${n}`, text });
	}
	return defs;
}

/**
 * Parse each acceptance criterion and derive its live status by cross-
 * referencing the goal tracker's Active Tasks, Blocking Side Issues, and
 * Completed and Verified tables. Status priority: verified > blocked >
 * in_progress > pending.
 */
export function parseAcceptanceCriteria(md: string): AcItem[] {
	const lines = md.split(/\r?\n/);
	const acSection = sliceSection(
		lines,
		/^###\s+Acceptance Criteria/,
		/^(---\s*$|##\s)/,
	);
	const activeSection = sliceSection(lines, /^####\s+Active Tasks/, /^###/);
	const blockingSection = sliceSection(
		lines,
		/^###\s+Blocking Side Issues/,
		/^###/,
	);
	const completedSection = sliceSection(
		lines,
		/^###\s+Completed and Verified/,
		/^###/,
	);

	const order: string[] = [];
	const byId = new Map<string, AcItem>();
	const ensure = (id: string, text?: string): AcItem => {
		let item = byId.get(id);
		if (!item) {
			item = {
				id,
				text: text ?? id,
				status: "pending",
				verifiedRound: null,
				evidence: null,
				blockingIssue: null,
				tasks: [],
			};
			byId.set(id, item);
			order.push(id);
		} else if (text && (item.text === id || item.text.length === 0)) {
			item.text = text;
		}
		return item;
	};

	for (const def of extractAcDefinitions(acSection)) ensure(def.id, def.text);

	// Active tasks → record targets; in_progress bumps status from pending.
	for (const row of parseMarkdownTable(activeSection)) {
		const target = row["Target AC"] ?? "";
		const taskName = (row.Task ?? "").trim();
		const status = (row.Status ?? "").toLowerCase();
		const inProgress = status.includes("in_progress") || status === "active";
		for (const id of acIdsIn(target)) {
			const item = byId.get(id);
			if (!item) continue;
			if (taskName && taskName !== "-" && !item.tasks.includes(taskName)) {
				item.tasks.push(taskName);
			}
			if (inProgress && item.status === "pending") item.status = "in_progress";
		}
	}

	// Blocking side issues → mark blocked (overrides pending/in_progress).
	for (const row of parseMarkdownTable(blockingSection)) {
		const issue = (row.Issue ?? "").trim();
		for (const id of acIdsIn(row["Blocking AC"] ?? "")) {
			const item = byId.get(id);
			if (!item) continue;
			if (item.status !== "verified") item.status = "blocked";
			if (issue && issue !== "-") item.blockingIssue = issue;
		}
	}

	// Completed and Verified → verified (highest priority). Add if unseen so the
	// completed count stays accurate even when defs missed it.
	for (const row of parseMarkdownTable(completedSection)) {
		const id = normalizeAcId(row.AC ?? "");
		if (!id) continue;
		const item = ensure(id, (row.Task ?? "").trim() || undefined);
		item.status = "verified";
		item.verifiedRound = toNumberOrNull((row["Verified Round"] ?? "").trim());
		const evidence = (row.Evidence ?? "").trim();
		item.evidence = evidence && evidence !== "-" ? evidence : null;
	}

	return order.map((id) => byId.get(id) as AcItem);
}

export interface TaskItem {
	/** Task description (first column of the Active Tasks table). */
	task: string;
	/** AC ids this task targets, e.g. `["AC-1", "AC-2"]`. */
	targetAcs: string[];
	/** Raw lowercased status, e.g. `in_progress` / `completed` / `skipped`. */
	status: string;
	tag: string | null;
	owner: string | null;
	notes: string | null;
}

/**
 * Parse the goal tracker's MUTABLE `#### Active Tasks` table into structured
 * rows. Robust to column-count variants (skip-impl drops Tag/Owner). Skips the
 * initialization placeholder row (`[To be populated…]`).
 */
export function parseActiveTasks(md: string): TaskItem[] {
	const lines = md.split(/\r?\n/);
	const activeSection = sliceSection(lines, /^####\s+Active Tasks/, /^###/);
	const tasks: TaskItem[] = [];
	for (const row of parseMarkdownTable(activeSection)) {
		const task = (row.Task ?? "").replace(/\*\*/g, "").trim();
		if (!task || task.startsWith("[To be")) continue;
		tasks.push({
			task,
			targetAcs: acIdsIn(row["Target AC"] ?? ""),
			status: (row.Status ?? "").toLowerCase().trim(),
			tag: (row.Tag ?? "").trim() || null,
			owner: (row.Owner ?? "").trim() || null,
			notes: (row.Notes ?? "").trim() || null,
		});
	}
	return tasks;
}

/**
 * Whether a `round-N-summary.md` has real content vs the untouched scaffold.
 * Ignores headings, list/bold markers, bracketed `[placeholders]`, and the
 * BitLesson defaults (`Action: none|add|update`, `Lesson ID(s): NONE`,
 * `Notes: [..]`). Works for the round-0, round-N+1, and review-round templates.
 */
export function isRoundSummaryFilled(md: string): boolean {
	for (const raw of md.split(/\r?\n/)) {
		let line = raw.trim();
		if (line.length === 0 || line.startsWith("#")) continue;
		line = line
			.replace(/^[-*]\s+/, "")
			.replace(/\*\*/g, "")
			.trim();
		if (line.length === 0) continue;
		if (/^\[.*\]$/.test(line)) continue; // bracketed placeholder
		if (/^Action:\s*(none(\|add\|update)?)\s*$/i.test(line)) continue;
		if (/^Lesson ID\(s\):\s*NONE\s*$/i.test(line)) continue;
		if (/^Notes:\s*(\[.*\])?\s*$/i.test(line)) continue;
		return true;
	}
	return false;
}

export interface GoalTrackerSummary {
	goal: string | null;
	acs: AcItem[];
	acsTotal: number;
	acsCompleted: number;
	tasks: TaskItem[];
	tasksActive: number;
	tasksCompleted: number;
	tasksDeferred: number;
	openIssues: number;
}

export function parseGoalTracker(md: string): GoalTrackerSummary {
	const lines = md.split(/\r?\n/);

	const acSection = sliceSection(
		lines,
		/^###\s+Acceptance Criteria/,
		/^(---\s*$|##\s)/,
	);
	const completedSection = sliceSection(
		lines,
		/^###\s+Completed and Verified/,
		/^###/,
	);
	const activeSection = sliceSection(lines, /^####\s+Active Tasks/, /^###/);
	const deferredSection = sliceSection(
		lines,
		/^###\s+Explicitly Deferred/,
		/^###/,
	);
	const blockingSection = sliceSection(
		lines,
		/^###\s+Blocking Side Issues/,
		/^###/,
	);
	const queuedSection = sliceSection(
		lines,
		/^###\s+Queued Side Issues/,
		/^###/,
	);
	const openIssuesSection = sliceSection(lines, /^###\s+Open Issues/, /^###/);

	let openIssues =
		countTableDataRows(blockingSection) + countTableDataRows(queuedSection);
	if (openIssues === 0) openIssues = countTableDataRows(openIssuesSection);

	const goalSection = sliceSection(lines, /^###\s+Ultimate Goal/, /^###/);
	const goalLine = goalSection.find((l) => {
		const t = l.trim();
		return t.length > 0 && !t.startsWith("[To be") && !t.startsWith("#");
	});

	// Prefer the richer per-criterion parse; fall back to the legacy regex
	// counts when the goal tracker has no recognizable AC ids yet.
	const acs = parseAcceptanceCriteria(md);
	const acsTotal = acs.length > 0 ? acs.length : countUniqueAcs(acSection);
	const acsCompleted =
		acs.length > 0
			? acs.filter((a) => a.status === "verified").length
			: countUniqueAcs(completedSection);

	return {
		goal: goalLine ? goalLine.trim() : null,
		acs,
		acsTotal,
		acsCompleted,
		tasks: parseActiveTasks(md),
		tasksActive: countTableDataRows(activeSection),
		tasksCompleted: countTableDataRows(completedSection),
		tasksDeferred: countTableDataRows(deferredSection),
		openIssues,
	};
}

/** Pick the highest-numbered `round-N-*.md` artifact (summary/review/prompt). */
export function findLatestRoundFile(
	fileNames: readonly string[],
): string | null {
	let best: string | null = null;
	let bestRound = -1;
	let bestRank = -1;
	// Prefer review-result > summary > contract > prompt for the same round.
	const rank = (name: string): number => {
		if (name.includes("review-result")) return 3;
		if (name.includes("summary")) return 2;
		if (name.includes("contract")) return 1;
		if (name.includes("prompt")) return 0;
		return -1;
	};
	for (const name of fileNames) {
		const match = name.match(/^round-(\d+)-.*\.md$/);
		if (!match) continue;
		const round = Number(match[1]);
		const r = rank(name);
		if (r === -1) continue;
		if (round > bestRound || (round === bestRound && r > bestRank)) {
			best = name;
			bestRound = round;
			bestRank = r;
		}
	}
	return best;
}

/**
 * Human label for the current phase within an active RLCR run. During the
 * Implementation Phase we split Build (Claude implementing) from Reviewing
 * (this round's summary is filled, so Codex reviews it) using
 * `currentRoundSummaryFilled`; the plugin's true Review Phase (Codex
 * `review --base`) is signalled by `review_started` / the review marker.
 */
export function derivePhaseLabel(
	status: LoopRunStatus,
	fields: LoopStateFields,
	hasReviewMarker: boolean,
	currentRoundSummaryFilled?: boolean,
): string {
	switch (status) {
		case "methodology-analysis":
			return "Methodology";
		case "finalize":
			return "Finalize";
		case "complete":
			return "Complete";
		case "cancel":
			return "Cancelled";
		case "maxiter":
			return "Max iterations";
		case "stop":
			return "Stopped";
		case "unexpected":
			return "Unexpected";
		case "active":
			if (fields.reviewStarted || hasReviewMarker) return "Review";
			if (currentRoundSummaryFilled) return "Reviewing";
			return "Build";
		default:
			return "Unknown";
	}
}
