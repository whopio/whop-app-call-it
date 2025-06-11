"use server";

import { and, eq, isNull, sum } from "drizzle-orm";
import { verifyUser } from "../authentication";
import db from "../db";
import { answersTable, gamesTable, votesTable } from "../db/schema";
import { whopApi } from "../whop-api";
import { sendUpdate } from "./load-game";

export async function revealAnswer(answerId: string) {
	const [game] = await db
		.select()
		.from(gamesTable)
		.innerJoin(answersTable, eq(gamesTable.id, answersTable.gameId))
		.where(eq(answersTable.id, answerId))
		.limit(1);

	if (!game) {
		throw new Error("Game not found");
	}

	if (game.games.correctAnswerId) {
		throw new Error("Game already completed");
	}

	if (!game.games.completedAt) {
		throw new Error("Game not completed");
	}

	await verifyUser(game.games.experienceId, "admin");

	const [answer] = await db
		.select()
		.from(answersTable)
		.where(eq(answersTable.id, answerId));

	if (!answer) {
		throw new Error("Answer not found");
	}

	const [updatedGame] = await db
		.update(gamesTable)
		.set({
			correctAnswerId: answerId,
		})
		.where(
			and(eq(gamesTable.id, game.games.id), isNull(gamesTable.correctAnswerId)),
		)
		.returning();

	if (!updatedGame) {
		return;
	}

	try {
		await handlePayout(game.games.id, answerId, updatedGame.experienceId);
	} catch (e) {
		console.error(e);
	}

	await sendUpdate(game.games.id);
}

async function handlePayout(
	gameId: string,
	answerId: string,
	experienceId: string,
) {
	const [totalPoolSum] = await db
		.select({
			totalPoolSum: sum(votesTable.receivedAmount),
		})
		.from(votesTable)
		.where(eq(votesTable.gameId, gameId));

	if (!totalPoolSum || totalPoolSum.totalPoolSum === null) {
		// No money was paid in.
		return;
	}

	const { company } = await whopApi.getCompanyLedgerAccount({
		companyId: process.env.WHOP_COMPANY_ID ?? "biz_XXXX",
	});
	const ledgerAccount = company?.ledgerAccount;
	if (!ledgerAccount) {
		throw new Error("No ledger account found");
	}

	// Subtract the 3% whop transfer fee
	const totalPool =
		Number(totalPoolSum.totalPoolSum) *
		((100 - (ledgerAccount.transferFee ?? 0)) / 100);

	const winners = await db
		.select()
		.from(votesTable)
		.where(eq(votesTable.answerId, answerId));

	const companyPayoutPercent = winners.length > 0 ? 0.1 : 0.8;

	const usersPayout = totalPool * 0.8;
	const companyPayout = totalPool * companyPayoutPercent;

	const payoutPerWinner = usersPayout / winners.length;

	await Promise.all(
		winners.map((winner) => {
			payoutWinner(
				winner.userId,
				payoutPerWinner,
				ledgerAccount.id,
				ledgerAccount.transferFee,
				gameId,
			);
		}),
	);

	await payoutWinningCompany(
		experienceId,
		companyPayout,
		ledgerAccount.id,
		ledgerAccount.transferFee,
		gameId,
	);
}

export async function payoutWinningCompany(
	experienceId: string,
	amount: number,
	ledgerAccountId: string,
	fee: number | null | undefined,
	gameId: string,
) {
	const { experience } = await whopApi.getExperience({ experienceId });
	const companyId = experience.company.id;
	if (amount < 1) return;
	await whopApi.payUser({
		input: {
			amount,
			currency: "usd",
			destinationId: companyId,
			idempotenceKey: `${companyId}-${gameId}`,
			ledgerAccountId,
			notes: "Payout for game",
			transferFee: fee,
		},
	});
}

async function payoutWinner(
	userId: string,
	amount: number,
	fromLedgerAccountId: string,
	fee: number | null | undefined,
	gameId: string,
) {
	if (amount < 1) return;
	await whopApi.payUser({
		input: {
			amount,
			currency: "usd",
			destinationId: userId,
			idempotenceKey: `${userId}-${gameId}`,
			ledgerAccountId: fromLedgerAccountId,
			notes: "Payout for game",
			transferFee: fee,
		},
	});
}
