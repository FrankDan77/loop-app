import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_dashboard/loop")({
	component: LoopLayout,
});

function LoopLayout() {
	return <Outlet />;
}
