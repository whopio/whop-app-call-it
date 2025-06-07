"use server";

import type { InferSelectModel, SQL } from "drizzle-orm";
import { and, desc, eq, sql } from "drizzle-orm";
import { verifyUser } from "../authentication";
import db from "../db";
import { answersTable, gamesTable, votesTable } from "../db/schema";
import { whopApi } from "../whop-api";

type Game = InferSelectModel<typeof gamesTable>;

interface GameWithStats extends Game {
	totalPoolSum: string | null;
}

export interface AnswerWithVotes {
	answerId: string;
	answer: string;
	voteCount: string;
}

export interface GameWithVotes {
	game: GameWithStats;
	answers: AnswerWithVotes[];
	userVoteAnswerId?: string | null;
}

// Load the game, and answers, load counts of everyone who has voted. Return MY current vote (if applicable)

export async function loadGame(
	experienceId: string,
): Promise<GameWithVotes | null> {
	const { userId } = await verifyUser(experienceId);
	const game = await loadGameWithByCondition(
		eq(gamesTable.experienceId, experienceId),
	);

	if (!game) {
		return null;
	}

	const userVote = await loadUserVote(game.game.id, userId);

	return {
		...game,
		userVoteAnswerId: userVote?.answerId ?? null,
	};
}

export async function loadGameByIdWithoutAuth(gameId: string) {
	return loadGameWithByCondition(eq(gamesTable.id, gameId));
}

export async function loadUserVote(gameId: string, userId: string) {
	const [vote] = await db
		.select()
		.from(votesTable)
		.where(and(eq(votesTable.gameId, gameId), eq(votesTable.userId, userId)));

	if (!vote) {
		return null;
	}

	return vote;
}

async function loadGameWithByCondition(condition: SQL) {
	const games = await db
		.select({
			id: gamesTable.id,
			createdAt: gamesTable.createdAt,
			updatedAt: gamesTable.updatedAt,
			question: gamesTable.question,
			answerCost: gamesTable.answerCost,
			experienceId: gamesTable.experienceId,
			createdByUserId: gamesTable.createdByUserId,
			completedAt: gamesTable.completedAt,
			correctAnswerId: gamesTable.correctAnswerId,
			totalPoolSum: sql<string | null>`sum(${votesTable.paidAmount})`,
		})
		.from(gamesTable)
		.where(condition)
		.orderBy(desc(gamesTable.createdAt))
		.leftJoin(votesTable, eq(gamesTable.id, votesTable.gameId))
		.groupBy(gamesTable.id)
		.limit(1);

	const game = games.at(0);

	if (!game) {
		return null;
	}

	const answers = await db
		.select({
			answerId: answersTable.id,
			answer: answersTable.answer,
			voteCount: sql<string>`count(${votesTable.id})`,
		})
		.from(answersTable)
		.leftJoin(votesTable, eq(answersTable.id, votesTable.answerId))
		.where(eq(answersTable.gameId, game.id))
		.groupBy(answersTable.id);

	const gameWithVotes: GameWithVotes = {
		game,
		answers,
	};

	return gameWithVotes;
}

export async function sendUpdate(gameId: string) {
	const game = await loadGameByIdWithoutAuth(gameId);

	if (!game) return;

	await whopApi.sendWebsocketMessage({
		target: { experience: game.game.experienceId },
		message: JSON.stringify(game),
	});

	return game;
}
