import { toast } from "@superset/ui/sonner";
import { useLiveQuery } from "@tanstack/react-db";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
} from "react";
import { env } from "renderer/env.renderer";
import { authClient } from "renderer/lib/auth-client";
import { electronTrpc } from "renderer/lib/electron-trpc";
import {
	setClientMachineId,
	setHostServiceSecret,
} from "renderer/lib/host-service-auth";
import type { HostServiceAvailabilityStatus } from "renderer/lib/host-service-unavailable";
import { LOCAL_MODE } from "renderer/lib/local-session";
import { LOCAL_ORG_ID, LOCAL_ORG_NAME, MOCK_ORG_ID } from "shared/constants";
import { useCollections } from "../CollectionsProvider";

interface LocalHostServiceContextValue {
	machineId: string;
	activeHostUrl: string | null;
	activeOrganizationId: string | null;
	activeOrganizationName: string | null;
	hostServiceStatus: HostServiceAvailabilityStatus;
}

const LocalHostServiceContext =
	createContext<LocalHostServiceContextValue | null>(null);

export function LocalHostServiceProvider({
	children,
}: {
	children: ReactNode;
}) {
	const { data: session } = authClient.useSession();
	const collections = useCollections();
	const { mutateAsync: startHostService } =
		electronTrpc.hostServiceCoordinator.start.useMutation();

	const activeOrganizationId = LOCAL_MODE
		? LOCAL_ORG_ID
		: env.SKIP_ENV_VALIDATION
			? MOCK_ORG_ID
			: (session?.session?.activeOrganizationId ?? null);

	const { data: organizations } = useLiveQuery(
		(q) => q.from({ organizations: collections.organizations }),
		[collections],
	);

	// In local mode there's no Electric `organizations` data, so drive the
	// host-service off a single fixed local org instead of the live query.
	const organizationIds = useMemo(
		() =>
			LOCAL_MODE
				? [LOCAL_ORG_ID]
				: (organizations?.map((organization) => organization.id) ?? []),
		[organizations],
	);

	// Cold start on first launch runs the SQLite migration synchronously and can
	// exceed the health-check timeout, so the main process SIGTERMs the child.
	// Auto-retry with backoff before surfacing the error toast.
	useEffect(() => {
		let cancelled = false;
		const MAX_ATTEMPTS = 5;
		const BASE_DELAY_MS = 1_500;

		async function startWithRetry(organizationId: string) {
			for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
				if (cancelled) return;
				try {
					await startHostService({ organizationId });
					return;
				} catch (error) {
					// Auth preconditions resolve once the token lands; not a real failure.
					const code = (error as { data?: { code?: string } })?.data?.code;
					if (code === "UNAUTHORIZED") return;
					console.error(
						`[host-service] start failed (attempt ${attempt}/${MAX_ATTEMPTS}):`,
						error,
					);
					if (attempt === MAX_ATTEMPTS) {
						toast.error("Host service failed to start", {
							description:
								error instanceof Error ? error.message : String(error),
						});
						return;
					}
					await new Promise((resolve) =>
						setTimeout(resolve, BASE_DELAY_MS * attempt),
					);
				}
			}
		}

		for (const organizationId of organizationIds) {
			void startWithRetry(organizationId);
		}

		return () => {
			cancelled = true;
		};
	}, [organizationIds, startHostService]);

	const { data: machineIdData } = electronTrpc.device.getMachineId.useQuery(
		undefined,
		{ staleTime: Number.POSITIVE_INFINITY },
	);

	useEffect(() => {
		if (machineIdData?.machineId) {
			setClientMachineId(machineIdData.machineId);
		}
	}, [machineIdData]);

	const { data: activeConnection } =
		electronTrpc.hostServiceCoordinator.getConnection.useQuery(
			{ organizationId: activeOrganizationId as string },
			{ enabled: !!activeOrganizationId, refetchInterval: 5_000 },
		);

	const { data: processStatus } =
		electronTrpc.hostServiceCoordinator.getProcessStatus.useQuery(
			{ organizationId: activeOrganizationId as string },
			{
				enabled: !!activeOrganizationId,
				refetchInterval: activeConnection?.port ? false : 1_000,
			},
		);

	const activeOrganizationName = useMemo(
		() =>
			LOCAL_MODE
				? LOCAL_ORG_NAME
				: (organizations?.find(
						(organization) => organization.id === activeOrganizationId,
					)?.name ?? null),
		[organizations, activeOrganizationId],
	);

	const value = useMemo<LocalHostServiceContextValue | null>(() => {
		if (!machineIdData) return null;
		const machineId = machineIdData.machineId;
		const hostServiceStatus: HostServiceAvailabilityStatus =
			activeConnection?.port != null
				? "running"
				: (processStatus?.status ?? "unknown");

		if (!activeConnection?.port) {
			return {
				machineId,
				activeHostUrl: null,
				activeOrganizationId: activeOrganizationId ?? null,
				activeOrganizationName,
				hostServiceStatus,
			};
		}

		const activeHostUrl = `http://127.0.0.1:${activeConnection.port}`;
		if (activeConnection.secret) {
			setHostServiceSecret(activeHostUrl, activeConnection.secret);
		}

		return {
			machineId,
			activeHostUrl,
			activeOrganizationId: activeOrganizationId ?? null,
			activeOrganizationName,
			hostServiceStatus,
		};
	}, [
		machineIdData,
		activeConnection,
		activeOrganizationId,
		activeOrganizationName,
		processStatus?.status,
	]);

	if (!value) return null;

	return (
		<LocalHostServiceContext.Provider value={value}>
			{children}
		</LocalHostServiceContext.Provider>
	);
}

export function useLocalHostService(): LocalHostServiceContextValue {
	const context = useContext(LocalHostServiceContext);
	if (!context) {
		throw new Error(
			"useLocalHostService must be used within LocalHostServiceProvider",
		);
	}
	return context;
}
