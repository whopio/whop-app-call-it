import { WhopWebsocketProvider } from "@whop/react/websockets";

export default async function ExperienceLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;

	return (
		<WhopWebsocketProvider joinExperience={experienceId}>
			<div className="flex flex-col gap-4 max-w-3xl mx-auto p-4">
				{children}
			</div>
		</WhopWebsocketProvider>
	);
}
