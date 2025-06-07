"use client";

import { Button, Heading, TextField } from "@whop/react/components";
import { TrashIcon } from "lucide-react";
import { useState } from "react";

export function AnswerOptionCreator() {
	const [options, setOptions] = useState<number[]>([0, 1]);

	const handleRemoveAnswerOption = (id: number) => {
		setOptions((prev) =>
			prev.length > 2 ? prev.filter((option) => option !== id) : prev,
		);
	};

	const handleAddAnswerOption = () => {
		setOptions((prev) =>
			prev.length >= 20 ? prev : [...prev, prev[prev.length - 1] + 1],
		);
	};

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<Heading size="3">Answer Options</Heading>
				<Button size="2" onClick={handleAddAnswerOption}>
					Add Option
				</Button>
			</div>
			{options.map((id, index) => (
				<SingleAnswerOption
					key={id}
					index={index}
					id={id}
					onRemove={handleRemoveAnswerOption}
				/>
			))}
		</div>
	);
}

function SingleAnswerOption({
	id,
	index,
	onRemove,
}: { index: number; id: number; onRemove: (id: number) => void }) {
	return (
		<div>
			<div className="flex gap-3 items-center">
				<button
					type="button"
					onClick={() => onRemove(id)}
					className="rounded-full flex items-center justify-center bg-accent-9 w-8 h-8 shrink-0 group relative hover:bg-danger-9"
				>
					<span className="text-3 text-white font-bold group-hover:opacity-0">
						{ALPHABET[index] ?? "Z"}
					</span>
					<TrashIcon className="opacity-0 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:opacity-100" />
				</button>

				<TextField.Root size="3" className="flex-1">
					<TextField.Input
						id={`answer-option-${index}`}
						name={`answer-option-${index}`}
						placeholder="Steven"
						required
					/>
				</TextField.Root>
			</div>
		</div>
	);
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
