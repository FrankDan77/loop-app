import { TRPCError } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { env } from "main/env.main";
import {
	getHostServiceCoordinator,
	type HostServiceStatusEvent,
} from "main/lib/host-service-coordinator";
import { z } from "zod";
import { publicProcedure, router } from "../..";
import { loadToken } from "../auth/utils/auth-functions";

const orgInput = z.object({ organizationId: z.string() });

/**
 * In local-only alpha mode there is no remote auth; skip the token check and
 * hand the coordinator a placeholder token + inert cloud API URL. Otherwise
 * require a real disk token.
 */
async function resolveCoordinatorAuth(): Promise<{
	authToken: string;
	cloudApiUrl: string;
}> {
	if (env.LOOP_LOCAL_MODE) {
		return {
			authToken: "local-mode-token",
			cloudApiUrl: env.NEXT_PUBLIC_API_URL,
		};
	}
	const { token } = await loadToken();
	if (!token) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "No auth token available — user must be logged in",
		});
	}
	return { authToken: token, cloudApiUrl: env.NEXT_PUBLIC_API_URL };
}

export const createHostServiceCoordinatorRouter = () => {
	return router({
		start: publicProcedure.input(orgInput).mutation(async ({ input }) => {
			const coordinator = getHostServiceCoordinator();
			return coordinator.start(
				input.organizationId,
				await resolveCoordinatorAuth(),
			);
		}),

		getConnection: publicProcedure.input(orgInput).query(({ input }) => {
			const coordinator = getHostServiceCoordinator();
			return coordinator.getConnection(input.organizationId);
		}),

		getProcessStatus: publicProcedure.input(orgInput).query(({ input }) => {
			const coordinator = getHostServiceCoordinator();
			return { status: coordinator.getProcessStatus(input.organizationId) };
		}),

		restart: publicProcedure.input(orgInput).mutation(async ({ input }) => {
			const coordinator = getHostServiceCoordinator();
			return coordinator.restart(
				input.organizationId,
				await resolveCoordinatorAuth(),
			);
		}),

		reset: publicProcedure.input(orgInput).mutation(async ({ input }) => {
			const coordinator = getHostServiceCoordinator();
			return coordinator.reset(
				input.organizationId,
				await resolveCoordinatorAuth(),
			);
		}),

		onStatusChange: publicProcedure.subscription(() => {
			return observable<HostServiceStatusEvent>((emit) => {
				const coordinator = getHostServiceCoordinator();
				const handler = (event: HostServiceStatusEvent) => emit.next(event);
				coordinator.on("status-changed", handler);
				return () => coordinator.off("status-changed", handler);
			});
		}),
	});
};
