"use server";

import { and, eq } from "drizzle-orm";
import { verifyUser } from "../authentication";
import db from "../db";
import { answersTable, gamesTable, votesTable } from "../db/schema";
import { whopSdk } from "../whop-sdk";

export async function submitVote(answerId: string) {
	const [game] = await db
		.select()
		.from(gamesTable)
		.innerJoin(answersTable, eq(gamesTable.id, answersTable.gameId))
		.where(eq(answersTable.id, answerId))
		.limit(1);

	if (!game) {
		throw new Error("Game not found");
	}

	if (game.games.completedAt || game.games.correctAnswerId) {
		throw new Error("Game already completed");
	}

	const { userId, accessLevel } = await verifyUser(game.games.experienceId);

	if (accessLevel === "admin") {
		throw Error("Admins cannot vote");
	}

	const existingVotes = await db
		.select()
		.from(votesTable)
		.where(
			and(eq(votesTable.userId, userId), eq(votesTable.gameId, game.games.id)),
		);

	if (existingVotes.length > 0) {
		return;
	}

	const chargeUser = await whopSdk.payments.chargeUser({
		amount: game.games.answerCost,
		currency: "usd",
		userId,
		metadata: { answerId, gameId: game.games.id },
	});

	if (!chargeUser) {
		throw new Error("Failed to charge user");
	}

	return chargeUser.inAppPurchase;
}
