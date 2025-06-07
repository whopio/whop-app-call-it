import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const DATABASE_URL =
	process.env.POSTGRES_URL ?? "postgres://localhost:5432/whop-app-call-it";

const db = drizzle(DATABASE_URL, { schema });

export default db;
