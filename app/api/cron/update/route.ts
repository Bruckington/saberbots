import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import axios from 'axios';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Fetch fresh odds (using The-Odds-API as an example)
    const oddsRes = await axios.get(`https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/`, {
      params: { 
        apiKey: process.env.ODDS_API_KEY, 
        regions: 'us', 
        markets: 'h2h', 
        bookmakers: 'fanduel' 
      }
    });

    // 3. Loop through games and update your DB
    for (const game of oddsRes.data) {
      const fanduel = game.bookmakers.find((b: any) => b.key === 'fanduel');
      if (!fanduel) continue;

      const hOdds = fanduel.markets[0].outcomes.find((o: any) => o.name === game.home_team)?.price;
      const aOdds = fanduel.markets[0].outcomes.find((o: any) => o.name === game.away_team)?.price;

      await pool.query(`
        UPDATE mlb_predictions 
        SET home_odds_fanduel = $1, away_odds_fanduel = $2 
        WHERE home_team = $3 OR away_team = $4`,
        [hOdds, aOdds, game.home_team, game.away_team]
      );
    }

    return NextResponse.json({ success: true, message: "8 AM Odds Synchronized" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Update Failed' }, { status: 500 });
  }
}