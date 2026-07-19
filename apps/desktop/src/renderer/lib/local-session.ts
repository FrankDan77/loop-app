import { DEV_EMAIL, DEV_NAME } from "@superset/shared/dev-credentials";
import { env } from "renderer/env.renderer";
import { LOCAL_ORG_ID, LOCAL_USER_ID } from "shared/constants";

/**
 * Whether the app is running in local-only alpha mode (no remote backend).
 * Baked in at build time via `LOOP_LOCAL_MODE` (defaults to true for this fork).
 */
export const LOCAL_MODE = env.LOOP_LOCAL_MODE === "true";

/**
 * A synthetic session used in local-only alpha mode so the app boots straight
 * into a signed-in state without talking to the remote auth backend.
 *
 * Shape mirrors the subset of the better-auth session that the app reads.
 */
export function getLocalSession() {
	const onboardedAt = new Date("2020-01-01T00:00:00.000Z");
	return {
		user: {
			id: LOCAL_USER_ID,
			email: DEV_EMAIL,
			name: DEV_NAME,
			emailVerified: true,
			image: null,
			createdAt: onboardedAt,
			updatedAt: onboardedAt,
			onboardedAt,
		},
		session: {
			id: "local-session",
			userId: LOCAL_USER_ID,
			activeOrganizationId: LOCAL_ORG_ID,
			organizationIds: [LOCAL_ORG_ID],
			role: "owner" as const,
			plan: "pro" as const,
		},
	};
}

/** Placeholder bearer token used to satisfy token-presence checks in local mode. */
export const LOCAL_AUTH_TOKEN = "local-mode-token";
