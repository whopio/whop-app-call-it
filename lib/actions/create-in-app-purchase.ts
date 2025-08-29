"use server";

import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";

export async function createInAppPurchase() {
	const { userId } = await whopSdk.verifyUserToken(await headers());
	const chargeUser = await whopSdk.payments.chargeUser({
		amount: 69,
		currency: "usd",
		userId,
		metadata: { reason: "dont-click-this-button" },
	});

	if (!chargeUser) {
		throw new Error("Failed to charge user");
	}

	return chargeUser.inAppPurchase;
}
