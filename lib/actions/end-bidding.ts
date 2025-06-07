"use server";

import { and, eq, isNull } from "drizzle-orm";
import { verifyUser } from "../authentication";
import db from "../db";
import { gamesTable } from "../db/schema";
import { sendUpdate } from "./load-game";

export async function endBidding(gameId: string) {
	const [game] = await db
		.select()
		.from(gamesTable)
		.where(eq(gamesTable.id, gameId))
		.limit(1);

	if (!game) {
		throw new Error("Game not found");
	}

	if (game.correctAnswerId) {
		throw new Error("Game already completed");
	}

	if (game.completedAt) {
		throw new Error("Game already ended.");
	}

	await verifyUser(game.experienceId, "admin");

	const [updatedGame] = await db
		.update(gamesTable)
		.set({
			completedAt: new Date().toISOString(),
		})
		.where(and(eq(gamesTable.id, game.id), isNull(gamesTable.completedAt)))
		.returning();

	if (!updatedGame) {
		return;
	}

	await sendUpdate(game.id);
}
