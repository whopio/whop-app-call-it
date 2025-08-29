import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { Button } from "./button";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;

	if (!(await isAdmin(companyId))) {
		return <CustomerEmptyState />;
	}

	return <ButtonPage />;
}

async function isAdmin(companyId: string) {
	try {
		const { userId } = await whopSdk.verifyUserToken(await headers());
		const { accessLevel } = await whopSdk.access.checkIfUserHasAccessToCompany({
			companyId,
			userId,
		});

		return accessLevel === "admin";
	} catch (error) {
		return false;
	}
}

function CustomerEmptyState() {
	return (
		<div className="flex items-center justify-center h-48">
			<div className="text-center">
				<h3 className="text-lg font-medium mb-2 text-gray-12">
					Access Restricted
				</h3>
				<p className="text-gray-10">
					You do not have access to view this page.
				</p>
			</div>
		</div>
	);
}

function ButtonPage() {
	return (
		<div className="h-96 flex items-center justify-center p-6">
			<div className="text-center">
				{/* Main Button with Cool Glow */}
				<div className="relative group mb-8">
					{/* Outer Glow Ring */}
					<div className="absolute -inset-4 bg-gradient-to-r from-purple-6 via-blue-5 to-purple-6 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-pulse" />

					{/* Inner Glow Ring */}
					<div className="absolute -inset-2 bg-gradient-to-r from-purple-5 via-blue-4 to-purple-5 rounded-3xl blur-lg opacity-50 group-hover:opacity-75 transition duration-300" />

					{/* Button */}
					<Button />
				</div>

				{/* Fun Text */}
				<p className="text-purple-8 text-lg font-medium animate-pulse">
					Seriously, don't do it... 👀
				</p>
			</div>
		</div>
	);
}
