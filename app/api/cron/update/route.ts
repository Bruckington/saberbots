import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import axios from 'axios';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('secret') !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const oddsRes = await axios.get(`https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/`, {
      params: { 
        apiKey: process.env.ODDS_API_KEY, 
        regions: 'us', 
        markets: 'h2h', 
        bookmakers: 'fanduel',
        oddsFormat: 'american' // Matches your dashboard style
      }
    });

    for (const game of oddsRes.data) {
      const fanduel = game.bookmakers.find((b: any) => b.key === 'fanduel');
      if (!fanduel) continue;

      for (const outcome of fanduel.markets[0].outcomes) {
        const isHome = outcome.name === game.home_team;
        // The-Odds-API provides home_pitcher/away_pitcher in the main game object
        const pitcherName = isHome ? game.home_pitcher : game.away_pitcher;

        await pool.query(`
          INSERT INTO mlb_moneylines (
            event_id, home_team, away_team, commence_time, 
            outcome_name, team_side, price, pitcher, fetched_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          ON CONFLICT (event_id, outcome_name) 
          DO UPDATE SET 
            price = EXCLUDED.price,
            pitcher = EXCLUDED.pitcher,
            fetched_at = NOW();`,
          [
            game.id, game.home_team, game.away_team, game.commence_time,
            outcome.name, isHome ? 'home' : 'away', outcome.price, pitcherName || 'TBD'
          ]
        );
      }
    }
    return NextResponse.json({ success: true, message: "Dashboard Data Synced" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}