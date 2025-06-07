import { loadGame } from "@/lib/actions/load-game";
import { verifyUser } from "@/lib/authentication";
import { Button } from "@whop/react/components";
import Link from "next/link";
import { GameView } from "./game.client";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;
	const { accessLevel, userId } = await verifyUser(experienceId);

	const game = await loadGame(experienceId);

	return (
		<div className="flex flex-col gap-4 max-w-3xl mx-auto p-4">
			{accessLevel === "admin" && (
				<Link href={`/experiences/${experienceId}/create`}>
					<Button>Create Game</Button>
				</Link>
			)}

			{game ? (
				<GameView serverGame={game} isAdmin={accessLevel === "admin"} />
			) : accessLevel === "admin" ? (
				<CreatorEmptyState />
			) : (
				<CustomerEmptyState />
			)}
		</div>
	);
}

function CreatorEmptyState() {
	return <div>CreatorEmptyState</div>;
}

function CustomerEmptyState() {
	return <div>CustomerEmptyState</div>;
}
