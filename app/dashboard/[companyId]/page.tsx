import { whopSdk } from "@/lib/whop-sdk";
import { ArrowRight } from "lucide-react";
import { headers } from "next/headers";

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
					<button
						type="button"
						className="relative bg-gradient-to-r from-purple-6 via-blue-5 to-purple-6 hover:from-purple-5 hover:via-blue-4 hover:to-purple-5 text-gray-12 px-16 py-8 rounded-3xl shadow-2xl border-2 border-purple-3/30 transition-all duration-300 transform hover:scale-110 hover:shadow-purple-5/50 active:scale-95 group-hover:shadow-purple-5/75"
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
				</div>

				{/* Fun Text */}
				<p className="text-purple-8 text-lg font-medium animate-pulse">
					Seriously, don't do it... 👀
				</p>
			</div>
		</div>
	);
}
