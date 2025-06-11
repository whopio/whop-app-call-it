import { loadGame } from "@/lib/actions/load-game";
import { verifyUser } from "@/lib/authentication";
import { redirect } from "next/navigation";
import { GameView } from "./game.client";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;
	const { accessLevel } = await verifyUser(experienceId);

	const game = await loadGame(experienceId);

	if (game) {
		return <GameView serverGame={game} isAdmin={accessLevel === "admin"} />;
	}

	if (accessLevel === "admin") {
		return <CreatorEmptyState experienceId={experienceId} />;
	}

	return <CustomerEmptyState />;
}

function CreatorEmptyState({ experienceId }: { experienceId: string }) {
	return redirect(`/experiences/${experienceId}/create`);
}

function CustomerEmptyState() {
	return (
		<div>
			There are no games running right now. Wait for the creator to start one.
		</div>
	);
}
