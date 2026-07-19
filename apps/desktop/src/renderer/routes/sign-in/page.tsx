import {
	DEV_EMAIL,
	DEV_NAME,
	DEV_PASSWORD,
} from "@superset/shared/dev-credentials";
import { Button } from "@superset/ui/button";
import { Spinner } from "@superset/ui/spinner";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { env } from "renderer/env.renderer";
import { setAuthToken } from "renderer/lib/auth-client";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { LOCAL_MODE } from "renderer/lib/local-session";
import { LoopLogo } from "./components/LoopLogo";
import { useSessionRecovery } from "./hooks/useSessionRecovery";

export const Route = createFileRoute("/sign-in/")({
	component: SignInPage,
});

function SignInPage() {
	// Local-only alpha: the app is always "signed in" via the stub session,
	// so skip sign-in entirely and go straight to the v2 workspaces list
	// (local mode is v2-only; the v1 route would trip the version-mismatch gate).
	if (LOCAL_MODE) {
		return <Navigate to="/v2-workspaces" replace />;
	}

	return <SignInPageInner />;
}

function SignInPageInner() {
	const persistToken = electronTrpc.auth.persistToken.useMutation();
	const navigate = useNavigate();
	const [isLoadingDev, setIsLoadingDev] = useState(false);
	const [devError, setDevError] = useState<string | null>(null);
	const { hasLocalToken, isPending, session } = useSessionRecovery();
	const hasAttemptedRef = useRef(false);
	const isDev = env.NODE_ENV === "development";

	const signInAsDev = useCallback(async () => {
		setIsLoadingDev(true);
		setDevError(null);

		const postAuth = async (path: string, body: Record<string, unknown>) => {
			const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "omit",
				body: JSON.stringify(body),
			});
			const data = (await response.json().catch(() => ({}))) as {
				token?: string;
				code?: string;
				message?: string;
			};
			return { ok: response.ok, status: response.status, data };
		};

		try {
			let result = await postAuth("/api/auth/sign-in/email", {
				email: DEV_EMAIL,
				password: DEV_PASSWORD,
			});
			if (!result.ok && result.data.code === "INVALID_EMAIL_OR_PASSWORD") {
				const signUp = await postAuth("/api/auth/sign-up/email", {
					email: DEV_EMAIL,
					password: DEV_PASSWORD,
					name: DEV_NAME,
				});
				if (!signUp.ok) {
					throw new Error(
						signUp.data.message ?? `Sign-up failed (${signUp.status})`,
					);
				}
				result = await postAuth("/api/auth/sign-in/email", {
					email: DEV_EMAIL,
					password: DEV_PASSWORD,
				});
			}
			if (!result.ok) {
				throw new Error(
					result.data.message ?? `Sign-in failed (${result.status})`,
				);
			}
			const token = result.data.token;
			if (!token) throw new Error("Sign-in did not return a token");
			const expiresAt = new Date(
				Date.now() + 1000 * 60 * 60 * 24 * 30,
			).toISOString();
			await persistToken.mutateAsync({ token, expiresAt });
			setAuthToken(token);
			await navigate({ to: "/workspace", replace: true });
		} catch (error) {
			setDevError(
				error instanceof Error ? error.message : "Dev sign-in failed",
			);
			setIsLoadingDev(false);
		}
	}, [navigate, persistToken]);

	// Auto sign-in as the local dev account. GitHub/Google auth is intentionally
	// disabled for the local Loop client; local dev is the default identity.
	useEffect(() => {
		if (!isDev) return;
		if (isPending) return;
		if (session?.user || hasLocalToken) return;
		if (isLoadingDev || devError) return;
		if (hasAttemptedRef.current) return;
		hasAttemptedRef.current = true;
		void signInAsDev();
	}, [
		isDev,
		isPending,
		session?.user,
		hasLocalToken,
		isLoadingDev,
		devError,
		signInAsDev,
	]);

	// Dev bypass: skip sign-in entirely
	if (env.SKIP_ENV_VALIDATION) {
		return <Navigate to="/workspace" replace />;
	}

	// Show loading while session is being fetched
	if (isPending) {
		return (
			<div className="flex h-screen w-screen items-center justify-center bg-background">
				<Spinner className="size-8" />
			</div>
		);
	}

	// If already signed in, redirect to workspace
	if (session?.user) {
		return <Navigate to="/workspace" replace />;
	}

	const retryDevSignIn = () => {
		hasAttemptedRef.current = true;
		void signInAsDev();
	};

	return (
		<div className="flex flex-col h-full w-full bg-background">
			<div className="h-12 w-full drag shrink-0" />

			<div className="flex flex-1 items-center justify-center">
				<div className="flex flex-col items-center w-full max-w-md px-8">
					<div className="mb-8">
						<LoopLogo className="h-12 w-auto" />
					</div>

					<div className="text-center mb-8">
						<h1 className="text-xl font-semibold text-foreground mb-2">
							Welcome to Loop
						</h1>
						<p className="text-sm text-muted-foreground">
							{isDev
								? "Signing in as Local Admin…"
								: "Local development sign-in only"}
						</p>
					</div>

					{isDev ? (
						devError ? (
							<div className="flex flex-col items-center gap-3 w-full max-w-xs">
								<p className="text-xs text-destructive text-center select-text cursor-text">
									{devError}
								</p>
								<Button
									variant="outline"
									size="lg"
									onClick={retryDevSignIn}
									className="w-full gap-3"
									disabled={isLoadingDev}
								>
									{isLoadingDev ? "Signing in…" : "Retry"}
								</Button>
							</div>
						) : (
							<Spinner className="size-6" />
						)
					) : (
						<p className="text-sm text-muted-foreground text-center max-w-xs">
							This build only supports the local development account. Run in
							development mode to sign in.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
