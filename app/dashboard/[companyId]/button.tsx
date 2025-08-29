"use client";

import { createInAppPurchase } from "@/lib/actions/create-in-app-purchase";
import { useIframeSdk } from "@whop/react/iframe";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

export function Button() {
	const [isLoading, setIsLoading] = useState(false);
	const iframeSdk = useIframeSdk();

	async function handleClick() {
		setIsLoading(true);
		const inAppPurchase = await createInAppPurchase();
		if (inAppPurchase) {
			await iframeSdk.inAppPurchase(inAppPurchase);
		}
		setIsLoading(false);
	}

	return (
		<button
			type="button"
			className="relative bg-gradient-to-r from-purple-6 via-blue-5 to-purple-6 hover:from-purple-5 hover:via-blue-4 hover:to-purple-5 text-gray-12 px-16 py-8 rounded-3xl shadow-2xl border-2 border-purple-3/30 transition-all duration-300 transform hover:scale-110 hover:shadow-purple-5/50 active:scale-95 group-hover:shadow-purple-5/75"
			onClick={handleClick}
			disabled={isLoading}
		>
			<div className="flex items-center gap-4">
				<span className="text-3xl font-black text-gray-12 tracking-wide">
					Don't Click This Button
				</span>
				<ArrowRight className="h-8 w-8 text-gray-12 group-hover:translate-x-2 transition-transform duration-300" />
			</div>

			{/* Button Inner Glow */}
			<div className="absolute inset-0 bg-gradient-to-r from-purple-4/20 via-blue-3/20 to-purple-4/20 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300" />
		</button>
	);
}
