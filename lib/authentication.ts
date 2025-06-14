import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { cache } from "react";

export const verifyUser = cache(
	async (experienceId: string, level?: "admin") => {
		const headersList = await headers();
		const { userId } = await whopSdk.verifyUserToken(headersList);

		const { accessLevel } =
			await whopSdk.access.checkIfUserHasAccessToExperience({
				userId,
				experienceId,
			});

		if (level && accessLevel !== level) {
			throw new Error("User must be an admin to access this page");
		}
		if (accessLevel === "no_access") {
			throw new Error("User does not have access to experience");
		}

		return { userId, accessLevel };
	},
);
