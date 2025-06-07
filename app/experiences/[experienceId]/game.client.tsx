"use client";

import type { AnswerWithVotes, GameWithVotes } from "@/lib/actions/load-game";
import { submitVote } from "@/lib/actions/submit-vote";
import { cn } from "@/lib/cn";
import { WhopWebsocketProvider } from "@/lib/websocket-provider";
import { useIframeSdk } from "@whop/react";
import { Button, Card, Heading, Text } from "@whop/react/components";
import { UsersIcon } from "lucide-react";
import { useState } from "react";

export function GameView({ serverGame }: { serverGame: GameWithVotes }) {
	const [game, setGame] = useState(serverGame);

	const totalVotes = game.answers.reduce(
		(sum, answer) => sum + Number.parseInt(answer.voteCount),
		0,
	);

	return (
		<WhopWebsocketProvider
			joinExperience={serverGame.game.experienceId}
			onAppMessage={(message) => {
				if (message.isTrusted) {
					const newGame = JSON.parse(message.json) as GameWithVotes;
					setGame(newGame);
				}
			}}
		>
			<div className="space-y-6">
				{/* Stats Boxes */}
				<div className="flex gap-4">
					<div className="flex-1 bg-green-a5 rounded-lg px-4 py-2">
						<Text size="1" className="text-green-a9">
							Total Pool
						</Text>
						<Heading size="7" className="text-green-a10" weight="bold">
							${game.game.totalPoolSum || "0"}
						</Heading>
					</div>
					<div className="flex-1 bg-blue-a3 rounded-lg px-4 py-2">
						<Text size="1" className="text-blue-a10">
							Players
						</Text>
						<Heading size="7" className="text-blue-a11" weight="bold">
							<UsersIcon className="inline-block mr-1" />
							{totalVotes}
						</Heading>
					</div>
				</div>

				{/* Question Card */}
				<Card>
					<span className="text-2 text-gray-a9 mb-1">Can you call it?</span>
					<Heading size="3">{game.game.question}</Heading>
				</Card>

				<Answers
					answers={game.answers}
					totalVotes={totalVotes}
					correctAnswerId={game.game.correctAnswerId}
				/>
			</div>
		</WhopWebsocketProvider>
	);
}

function Answers({
	answers,
	totalVotes,
	correctAnswerId,
}: {
	answers: AnswerWithVotes[];
	totalVotes: number;
	correctAnswerId: string | null;
}) {
	const iframeSdk = useIframeSdk();
	const userSelected = answers.find((a) => a.didSelect);
	const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(
		userSelected?.answerId ?? null,
	);
	const canSelect = !correctAnswerId && !userSelected;
	const [isLoading, setIsLoading] = useState(false);

	function handleSelect(answerId: string) {
		if (!canSelect) return;
		setSelectedAnswerId(answerId);
	}

	async function handleSubmit() {
		if (!canSelect || !selectedAnswerId) return;
		setIsLoading(true);
		try {
			const inAppPurchase = await submitVote(selectedAnswerId);
			if (inAppPurchase) {
				await iframeSdk.inAppPurchase(inAppPurchase);
			}
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<>
			<div className="flex flex-col gap-2">
				{answers.map((answer, index) => (
					<AnswerOption
						key={answer.answerId}
						answer={answer}
						index={index}
						totalVotes={totalVotes}
						isSelected={selectedAnswerId === answer.answerId}
						isCorrect={correctAnswerId === answer.answerId}
						onSelect={() => handleSelect(answer.answerId)}
					/>
				))}
			</div>

			{/* Submit Button */}
			<Button
				size="4"
				className="w-full"
				variant="classic"
				loading={isLoading}
				disabled={isLoading}
				onClick={handleSubmit}
			>
				Submit Answer
			</Button>
		</>
	);
}

function AnswerOption({
	answer,
	index,
	totalVotes,
	isSelected,
	isCorrect,
	onSelect,
}: {
	answer: AnswerWithVotes;
	totalVotes: number;
	index: number;
	isSelected: boolean;
	isCorrect: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			className={cn(
				"flex p-3 gap-2 flex-col w-full border border-stroke rounded-lg bg-gray-a3 hover:bg-gray-a4 transition-colors",
				{
					"border-blue-9 hover:bg-blue-a3 bg-blue-a3": isSelected,
					"border-green-9 hover:bg-green-a3 bg-green-a3": isCorrect,
				},
			)}
			onClick={onSelect}
		>
			<div className="flex items-center w-full gap-3">
				<div className="w-8 h-8 flex items-center rounded-full justify-center uppercase bg-gray-a4 text-gray-12 font-bold text-4">
					{String.fromCharCode(97 + index)}
				</div>

				<div className="flex-1 w-full">
					<Text
						size="3"
						className="block text-gray-a12 w-full text-left"
						weight="medium"
					>
						{answer.answer}
					</Text>
				</div>

				<div className="flex flex-col items-end gap-0.5">
					<div className="flex items-center gap-1">
						<UsersIcon fontSize={10} className="w-4 h-4" />
						<Text weight="bold" size="2" className="text-gray-12">
							{answer.voteCount} votes
						</Text>
					</div>

					<Text size="1" className="text-gray-a9">
						{getPercentage(answer, totalVotes)}%
					</Text>
				</div>
			</div>
		</button>
	);
}

function getPercentage(answer: AnswerWithVotes, totalVotes: number) {
	if (totalVotes === 0) return "0";
	return ((Number.parseInt(answer.voteCount) / totalVotes) * 100).toFixed(0);
}
