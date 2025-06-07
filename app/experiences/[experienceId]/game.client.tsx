"use client";

import { endBidding } from "@/lib/actions/end-bidding";
import type { AnswerWithVotes, GameWithVotes } from "@/lib/actions/load-game";
import { revealAnswer } from "@/lib/actions/reveal-answer";
import { submitVote } from "@/lib/actions/submit-vote";
import { cn } from "@/lib/cn";
import { WhopWebsocketProvider } from "@/lib/websocket-provider";
import { useIframeSdk } from "@whop/react";
import { Button, Card, Heading, Text } from "@whop/react/components";
import { UsersIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function GameView({
	serverGame,
	isAdmin,
}: {
	serverGame: GameWithVotes;
	isAdmin: boolean;
}) {
	const [game, setGame] = useState(serverGame);

	const totalVotes = game.answers.reduce(
		(sum, answer) => sum + Number.parseInt(answer.voteCount),
		0,
	);

	function setAnswer(answerId: string) {
		setGame((oldGame) => ({
			...oldGame,
			userVoteAnswerId: answerId,
		}));
	}

	return (
		<WhopWebsocketProvider
			joinExperience={serverGame.game.experienceId}
			onAppMessage={(message) => {
				if (message.isTrusted) {
					const newGame = JSON.parse(message.json) as GameWithVotes;
					setGame((oldGame) => ({
						...oldGame,
						...newGame, // newGame won't have the userVoteAnswerId, so we need to merge it in
					}));
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
					completedAt={game.game.completedAt ?? null}
					userVoteAnswerId={game.userVoteAnswerId ?? null}
					isAdmin={isAdmin}
					gameId={game.game.id}
					experienceId={game.game.experienceId}
					setAnswer={setAnswer}
				/>
			</div>
		</WhopWebsocketProvider>
	);
}

function Answers({
	answers,
	totalVotes,
	correctAnswerId,
	completedAt,
	userVoteAnswerId,
	isAdmin,
	gameId,
	experienceId,
	setAnswer,
}: {
	answers: AnswerWithVotes[];
	totalVotes: number;
	correctAnswerId: string | null;
	completedAt: string | null;
	userVoteAnswerId: string | null;
	isAdmin: boolean;
	gameId: string;
	experienceId: string;
	setAnswer: (answerId: string) => void;
}) {
	const iframeSdk = useIframeSdk();
	const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(
		userVoteAnswerId,
	);

	const { text, action, canSelect, color } = ctaButtonText({
		isAdmin,
		completedAt,
		correctAnswerId,
		userVoteAnswerId,
		currentSelection: selectedAnswerId,
	});

	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	function handleSelect(answerId: string) {
		if (!canSelect) return;
		setSelectedAnswerId(answerId);
	}

	async function handleSubmit() {
		if (!action) return;
		setIsLoading(true);
		try {
			if (action === "vote") {
				if (!selectedAnswerId) return;
				const inAppPurchase = await submitVote(selectedAnswerId);
				if (inAppPurchase) {
					await iframeSdk.inAppPurchase(inAppPurchase);
				}
				setAnswer(selectedAnswerId);
			}
			if (action === "reveal") {
				if (!selectedAnswerId) return;
				await revealAnswer(selectedAnswerId);
			}
			if (action === "end") {
				await endBidding(gameId);
			}
			if (action === "create") {
				router.push(`/experiences/${experienceId}/create`);
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
						canSelect={!!canSelect}
					/>
				))}
			</div>

			{/* Submit Button */}
			<Button
				size="4"
				className="w-full"
				color={color}
				variant="classic"
				loading={isLoading}
				disabled={isLoading || !action}
				onClick={handleSubmit}
			>
				{text}
			</Button>
		</>
	);
}

function ctaButtonText({
	isAdmin,
	completedAt,
	correctAnswerId,
	userVoteAnswerId,
	currentSelection,
}: {
	isAdmin: boolean;
	completedAt: string | null;
	correctAnswerId: string | null;
	userVoteAnswerId: string | null;
	currentSelection: string | null;
}): {
	text: string;
	action?: "create" | "vote" | "end" | "reveal";
	canSelect?: boolean;
	color?: "red" | "green";
} {
	if (isAdmin) {
		if (correctAnswerId) return { text: "Start a new game", action: "create" };
		if (completedAt)
			return {
				text: `${currentSelection ? "Submit" : "Select"} Correct Answer`,
				action: currentSelection ? "reveal" : undefined,
				canSelect: true,
			};
		return {
			text: "End bidding",
			action: "end",
			color: "red",
		};
	}

	if (correctAnswerId) {
		if (correctAnswerId === userVoteAnswerId) return { text: "You won!" };
		if (userVoteAnswerId && correctAnswerId !== userVoteAnswerId)
			return { text: "Better luck next time" };
		return { text: "Waiting for the creator to start" };
	}
	if (completedAt) return { text: "Waiting for the big reveal" };
	if (userVoteAnswerId) return { text: "Will you get it right?" };
	return {
		text: "Submit Answer",
		action: currentSelection ? "vote" : undefined,
		canSelect: true,
	};
}

function AnswerOption({
	answer,
	index,
	totalVotes,
	isSelected,
	isCorrect,
	onSelect,
	canSelect,
}: {
	answer: AnswerWithVotes;
	totalVotes: number;
	index: number;
	isSelected: boolean;
	isCorrect: boolean;
	canSelect: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			className={cn(
				"flex p-3 gap-2 flex-col w-full border border-stroke rounded-lg bg-gray-a3 transition-colors",
				{
					"hover:bg-gray-a4": canSelect && !isSelected && !isCorrect,
					"border-blue-9 bg-blue-a3": isSelected,
					"border-green-9 bg-green-a3": isCorrect,
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
