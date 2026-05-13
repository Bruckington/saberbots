import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function GET() {
  try {
    // We are selecting from your actual table 'mlb_moneylines' 
    // and renaming columns to match what the dashboard wants
    const res = await pool.query(`
      SELECT 
        id, 
        home_team AS "homeTeam", 
        away_team AS "awayTeam", 
        50 AS "homeProb", 
        50 AS "awayProb", 
        price AS "homeOdds", 
        price AS "awayOdds" 
      FROM mlb_moneylines 
      ORDER BY id DESC
      LIMIT 20
    `);
    
    return NextResponse.json(res.rows);
  } catch (err: any) {
    console.error("Database Error:", err.message);
    return NextResponse.json({ 
      error: 'Connection Failed', 
      details: err.message 
    }, { status: 500 });
  }
}