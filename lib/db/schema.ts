import { createId } from "@paralleldrive/cuid2";
import {
	decimal,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
	createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true })
		.$onUpdate(() => new Date().toISOString())
		.notNull()
		.defaultNow(),
};

function primaryKeyColumn() {
	return varchar("id", { length: 64 })
		.primaryKey()
		.$defaultFn(() => createId());
}

export const gamesTable = pgTable("games", {
	id: primaryKeyColumn(),
	...timestamps,
	question: text("question").notNull(),
	answerCost: integer("answer_cost").notNull(),
	experienceId: varchar("experience_id", { length: 64 }).notNull(),
	createdByUserId: varchar("created_by_user_id", { length: 64 }).notNull(),
	completedAt: timestamp("completed_at", {
		mode: "string",
		withTimezone: true,
	}),
	correctAnswerId: varchar("correct_answer_id", { length: 64 }),
});

export const answersTable = pgTable("answers", {
	id: primaryKeyColumn(),
	...timestamps,
	answer: text("answer").notNull(),
	gameId: varchar("game_id", { length: 64 })
		.notNull()
		.references(() => gamesTable.id),
});

export const votesTable = pgTable(
	"votes",
	{
		id: primaryKeyColumn(),
		...timestamps,
		answerId: varchar("answer_id", { length: 64 })
			.notNull()
			.references(() => answersTable.id),
		gameId: varchar("game_id", { length: 64 })
			.notNull()
			.references(() => gamesTable.id),
		userId: varchar("user_id", { length: 64 }).notNull(),
		receiptId: varchar("receipt_id", { length: 64 }).notNull(),
		paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).notNull(),
		receivedAmount: decimal("received_amount", {
			precision: 10,
			scale: 2,
		}).notNull(),
	},
	(table) => [
		uniqueIndex("unique_game_id_user_id").on(table.gameId, table.userId),
	],
);
