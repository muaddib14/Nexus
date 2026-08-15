import { Pool } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;

// Helper to check if Neon DB connection string is valid
export const isDbConfigured = Boolean(
  connectionString && connectionString.startsWith("postgres")
);

// Serverless Pool instance for connection pooling in Next.js / Edge / Serverless
export const pool = isDbConfigured ? new Pool({ connectionString }) : null;

// Direct parameterized SQL query execution with graceful fallback
export async function query<T = any>(sqlQuery: string, params?: any[]): Promise<T[]> {
  if (!isDbConfigured || !pool) {
    return [];
  }

  try {
    const { rows } = await pool.query(sqlQuery, params);
    return rows as T[];
  } catch (error) {
    console.error("[NeonDB Query Error]", error);
    return [];
  }
}
