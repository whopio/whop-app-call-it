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

	return (
		<div className="flex flex-col gap-4 max-w-3xl mx-auto p-4">
			{game ? (
				<GameView serverGame={game} isAdmin={accessLevel === "admin"} />
			) : accessLevel === "admin" ? (
				<CreatorEmptyState experienceId={experienceId} />
			) : (
				<CustomerEmptyState />
			)}
		</div>
	);
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
