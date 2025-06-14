import { sendUpdate } from "@/lib/actions/load-game";
import db from "@/lib/db";
import { votesTable } from "@/lib/db/schema";
import { whopSdk } from "@/lib/whop-sdk";
import { waitUntil } from "@vercel/functions";
import { makeWebhookValidator } from "@whop/api";
import type { NextRequest } from "next/server";

const validateWebhook = makeWebhookValidator({
	webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "fallback",
});

export async function POST(request: NextRequest): Promise<Response> {
	// Validate the webhook to ensure it's from Whop
	const webhookData = await validateWebhook(request);

	// Handle the webhook event
	if (webhookData.action === "payment.succeeded") {
		const {
			id: receiptId,
			final_amount,
			amount_after_fees,
			currency,
			user_id,
			metadata,
		} = webhookData.data;

		console.log(
			`Payment ${receiptId} succeeded for ${user_id} with amount ${final_amount} ${currency}`,
		);

		await handleWebhook(
			receiptId,
			user_id,
			final_amount,
			currency,
			amount_after_fees,
			metadata,
		);
	}

	// Make sure to return a 2xx status code quickly. Otherwise the webhook will be retried.
	return new Response("OK", { status: 200 });
}

async function handleWebhook(
	receiptId: string,
	user_id: string | null | undefined,
	amount: number,
	currency: string,
	amount_after_fees: number | null | undefined,
	metadata?: Record<string, unknown> | null,
) {
	const answerId = metadata?.answerId;
	const gameId = metadata?.gameId;

	if (typeof answerId !== "string") {
		console.error(`No answerId found in metadata for receipt ${receiptId}`);
		return;
	}

	if (typeof gameId !== "string") {
		console.error(`No gameId found in metadata for receipt ${receiptId}`);
		return;
	}

	if (!user_id) {
		console.error(`No user_id found in webhook for receipt ${receiptId}`);
		return;
	}

	if (amount_after_fees === null || amount_after_fees === undefined) {
		console.error(
			`No amount_after_fees found in webhook for receipt ${receiptId}`,
		);
		return;
	}

	if (currency !== "usd") {
		console.error(
			`Currency ${currency} not supported for receipt ${receiptId}`,
		);
		return;
	}

	const receivedAmount = Number(amount_after_fees);

	await db.insert(votesTable).values({
		answerId,
		gameId,
		paidAmount: amount.toFixed(2),
		receivedAmount: receivedAmount.toFixed(2),
		userId: user_id,
		receiptId,
	});

	waitUntil(afterVote(gameId));
}
async function afterVote(gameId: string) {
	const game = await sendUpdate(gameId);
	if (!game) return;

	await whopSdk.notifications.sendPushNotification({
		title: "New player has submitted their vote!",
		subtitle: game.game.question,
		content: `The pot is now at $${game.game.totalPoolSum}`,
		experienceId: game.game.experienceId,
	});
}
