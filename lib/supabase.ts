import { Pool } from 'pg';

// This connects using your DATABASE_URL from .env.local
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const supabase = {
  from: (tableName: string) => ({
    select: (columns: string = '*') => ({
      // This allows your existing dashboard code to call .from().select()
      then: async (callback: any) => {
        try {
          const res = await pool.query(`SELECT ${columns} FROM ${tableName}`);
          return callback({ data: res.rows, error: null });
        } catch (err) {
          console.error("Database Error:", err);
          return callback({ data: [], error: err });
        }
      }
    })
  })
};