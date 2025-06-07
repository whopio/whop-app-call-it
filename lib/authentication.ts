import { verifyUserToken, whopApi } from "@/lib/whop-api";
import { headers } from "next/headers";
import { cache } from "react";

export const verifyUser = cache(
	async (experienceId: string, level?: "admin") => {
		const headersList = await headers();
		const { userId } = await verifyUserToken(headersList);

		const { hasAccessToExperience } =
			await whopApi.checkIfUserHasAccessToExperience({
				userId,
				experienceId,
			});

		const accessLevel = hasAccessToExperience.accessLevel;

		if (level && accessLevel !== level) {
			throw new Error("User must be an admin to access this page");
		}
		if (accessLevel === "no_access") {
			throw new Error("User does not have access to experience");
		}

		return { userId, accessLevel };
	},
);
