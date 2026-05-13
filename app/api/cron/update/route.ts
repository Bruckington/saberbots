import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import axios from 'axios';

// The SSL settings are required for the Supabase pooler (port 6543)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false 
  }
});

export async function GET(request: Request) {
  // 1. Security Check: Allows BOTH the browser link and Vercel Cron headers
  const { searchParams } = new URL(request.url);
  const urlSecret = searchParams.get('secret');
  const authHeader = request.headers.get('authorization');
  
  const isAuthorized = 
    urlSecret === process.env.CRON_SECRET || 
    authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isAuthorized) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Fetch fresh odds from The-Odds-API
    const oddsRes = await axios.get(`https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/`, {
      params: { 
        apiKey: process.env.ODDS_API_KEY, 
        regions: 'us', 
        markets: 'h2h', 
        bookmakers: 'fanduel' 
      }
    });

    // 3. Loop through games and update the mlb_moneylines table
    for (const game of oddsRes.data) {
      const fanduel = game.bookmakers.find((b: any) => b.key === 'fanduel');
      if (!fanduel) continue;

      const hOutcome = fanduel.markets[0].outcomes.find((o: any) => o.name === game.home_team);
      const aOutcome = fanduel.markets[0].outcomes.find((o: any) => o.name === game.away_team);

      if (hOutcome && aOutcome) {
        await pool.query(`
          UPDATE mlb_moneylines 
          SET price = $1, fetched_at = NOW() 
          WHERE home_team = $2 AND away_team = $3`,
          [hOutcome.price, game.home_team, game.away_team]
        );
      }
    }

    return NextResponse.json({ success: true, message: "8 AM Odds Synchronized" });
  } catch (err: any) {
    console.error("Cron Error:", err.message);
    return NextResponse.json(
      { error: 'Update Failed', details: err.message }, 
      { status: 500 }
    );
  }
}