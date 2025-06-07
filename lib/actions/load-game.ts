"use server";

import type { InferSelectModel } from "drizzle-orm";
import { aliasedTable, and, desc, eq, sql } from "drizzle-orm";
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
	didSelect: boolean;
}

export interface GameWithVotes {
	game: GameWithStats;
	answers: AnswerWithVotes[];
}

// Load the game, and answers, load counts of everyone who has voted. Return MY current vote (if applicable)

export async function loadGame(
	experienceId: string,
): Promise<GameWithVotes | null> {
	const { userId } = await verifyUser(experienceId);

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
		.where(eq(gamesTable.experienceId, experienceId))
		.orderBy(desc(gamesTable.createdAt))
		.leftJoin(votesTable, eq(gamesTable.id, votesTable.gameId))
		.groupBy(gamesTable.id)
		.limit(1);

	const game = games.at(0);

	if (!game) {
		return null;
	}

	const currentUserVotesTable = aliasedTable(votesTable, "current_user_votes");

	const answers = await db
		.select({
			answerId: answersTable.id,
			answer: answersTable.answer,
			voteCount: sql<string>`count(${votesTable.id})`,
			didSelect: sql<boolean>`count(${currentUserVotesTable.id}) > 0`,
		})
		.from(answersTable)
		.leftJoin(votesTable, eq(answersTable.id, votesTable.answerId))
		.leftJoin(
			currentUserVotesTable,
			and(
				eq(currentUserVotesTable.answerId, answersTable.id),
				eq(currentUserVotesTable.userId, userId),
			),
		)
		.where(eq(answersTable.gameId, game.id))
		.groupBy(answersTable.id);

	// Transform the data to include vote counts and user's vote
	const gameWithVotes: GameWithVotes = {
		game,
		answers,
	};

	return gameWithVotes;
}

export async function loadGameByIdWithoutAuth(gameId: string) {
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
		.where(eq(gamesTable.id, gameId))
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
			didSelect: sql<boolean>`false`,
		})
		.from(answersTable)
		.leftJoin(votesTable, eq(answersTable.id, votesTable.answerId))
		.where(eq(answersTable.gameId, game.id))
		.groupBy(answersTable.id);

	// Transform the data to include vote counts and user's vote
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
}
