import postgres, { type Sql, type TransactionSql } from "postgres";
import { getServerEnv, hasSupabaseServerEnv } from "@/server/env";

declare global {
  var __studentreachSql: Sql | undefined;
}

export function getSql() {
  if (!hasSupabaseServerEnv()) {
    throw new Error("Database access requires STUDENTREACH_DATABASE_URL and Supabase server credentials.");
  }

  if (!global.__studentreachSql) {
    const env = getServerEnv();
    global.__studentreachSql = postgres(env.STUDENTREACH_DATABASE_URL!, {
      prepare: false,
      max: 5,
      idle_timeout: 20,
      connect_timeout: 15,
    });
  }

  return global.__studentreachSql;
}

export async function withTransaction<T>(fn: (sql: TransactionSql) => Promise<T>) {
  const sql = getSql();
  return sql.begin(async (transaction) => fn(transaction));
}
