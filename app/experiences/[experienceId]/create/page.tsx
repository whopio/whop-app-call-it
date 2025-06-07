import { createGame } from "@/lib/actions/create-game";
import {
	Button,
	Callout,
	Card,
	Heading,
	IconButton,
	TextField,
} from "@whop/react/components";
import { ArrowLeft, DollarSign, InfoIcon } from "lucide-react";
import Link from "next/link";
import { AnswerOptionCreator } from "./answer-option-creator";

export default async function CreateGamePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const experienceId = (await params).experienceId;

	return (
		<div className="flex max-w-3xl mx-auto p-4">
			<div className="space-y-4 w-full">
				<div className="flex items-center gap-2">
					<Link href={`/experiences/${experienceId}`}>
						<IconButton>
							<ArrowLeft />
						</IconButton>
					</Link>
					<Heading>Create New Game</Heading>
				</div>

				<Card>
					<form action={createGame} className="flex flex-col gap-4 p-2">
						<input type="hidden" name="experienceId" value={experienceId} />

						<div className="flex flex-col gap-1">
							<label htmlFor="question" className="text-3 font-bold">
								Question
							</label>
							<TextField.Root size="3">
								<TextField.Input
									id="question"
									name="question"
									placeholder="Who will win the typing competition"
									required
								/>
							</TextField.Root>
						</div>

						<div className="flex flex-col gap-1">
							<label htmlFor="question" className="text-3 font-bold">
								Answer Cost
							</label>
							<TextField.Root size="3">
								<TextField.Slot>
									<DollarSign />
								</TextField.Slot>
								<TextField.Input
									id="answer-cost"
									name="answer-cost"
									placeholder="10"
									type="number"
									min={1}
									step={1}
									required
								/>
							</TextField.Root>
							<span className="text-1 text-gray-a9">
								How much does it cost to submit an answer
							</span>
						</div>

						<AnswerOptionCreator />

						<Button size="3" variant="classic" className="mt-4">
							Create Game
						</Button>
					</form>
				</Card>

				<Callout.Root>
					<Callout.Icon>
						<InfoIcon />
					</Callout.Icon>
					<Callout.Text>
						<span className="font-bold text-3">How it works</span>
						<br />- You write a question and provide preset answers
						<br />- Players pay to submit an answer each
						<br />- At your leisure, you end the game by selecting the correct
						answer
						<br />- The total amount of money paid in is split between users who
						"called it"
						<br />- You will receive 5% of the pot.
					</Callout.Text>
				</Callout.Root>
			</div>
		</div>
	);
}
