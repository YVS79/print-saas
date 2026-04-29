import { AsyncLocalStorage } from "node:async_hooks";
import { PoolClient } from "pg";
import { db } from "@/server/db/pool";

const transactionStorage = new AsyncLocalStorage<PoolClient>();

export type Queryable = Pick<PoolClient, "query">;

export function getCurrentQueryable(): Queryable {
  return transactionStorage.getStore() ?? db;
}

export async function withTransaction<T>(callback: () => Promise<T>): Promise<T> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const result = await transactionStorage.run(client, callback);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
