import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    const res = await pool.query(`
      SELECT 
        id, 
        home_team AS "homeTeam", 
        away_team AS "awayTeam", 
        home_win_prob AS "homeProb", 
        away_win_prob AS "awayProb", 
        home_odds_fanduel AS "homeOdds", 
        away_odds_fanduel AS "awayOdds" 
      FROM mlb_predictions 
      ORDER BY id ASC
    `);
    return NextResponse.json(res.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}