import os from "node:os";
import { getHostId, getHostName } from "@superset/shared/host-info";
import { TRPCError } from "@trpc/server";
// Relative path (not the "@loop/host-service" package alias) so the bundler
// inlines this JSON at build time. A bare-specifier import gets externalized
// into a runtime `require(...)` that cannot be resolved inside the packaged
// app.asar, which crashes host-service on startup.
import hostServicePackageJson from "../../../../package.json" with {
	type: "json",
};
import type { ApiClient } from "../../../types";
import { protectedProcedure, router } from "../../index";

// Auto-derived from this package's package.json so callers can report exactly
// which bundled host-service build is currently serving requests.
const HOST_SERVICE_VERSION: string = hostServicePackageJson.version;

const ORGANIZATION_CACHE_TTL_MS = 60 * 60 * 1000;

let cachedOrganization: {
	data: { id: string; name: string; slug: string };
	cachedAt: number;
} | null = null;

async function getOrganization(
	api: ApiClient,
	organizationId: string,
): Promise<{ id: string; name: string; slug: string }> {
	if (
		cachedOrganization &&
		cachedOrganization.data.id === organizationId &&
		Date.now() - cachedOrganization.cachedAt < ORGANIZATION_CACHE_TTL_MS
	) {
		return cachedOrganization.data;
	}

	const organization = await api.organization.getByIdFromJwt.query({
		id: organizationId,
	});
	if (!organization) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: "Organization not found or not accessible from JWT",
		});
	}

	cachedOrganization = { data: organization, cachedAt: Date.now() };
	return organization;
}

export const hostRouter = router({
	info: protectedProcedure.query(async ({ ctx }) => {
		// Local-only alpha: no cloud org to fetch — return a synthetic one.
		const organization = ctx.localMode
			? { id: ctx.organizationId, name: "Local", slug: "local" }
			: await getOrganization(ctx.api, ctx.organizationId);

		return {
			hostId: getHostId(),
			hostName: getHostName(),
			version: HOST_SERVICE_VERSION,
			organization,
			platform: os.platform(),
			uptime: process.uptime(),
		};
	}),
});
