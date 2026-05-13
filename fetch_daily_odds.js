const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const API_KEY = 'YOUR_THE_ODDS_API_KEY'; // Get a free key at the-odds-api.com

async function updateOdds() {
  try {
    // 1. Fetch MLB Odds from FanDuel via API
    const response = await axios.get(`https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/`, {
      params: { apiKey: API_KEY, regions: 'us', markets: 'h2h', bookmakers: 'fanduel', oddsFormat: 'american' }
    });

    // 2. Clear table for the new day
    await pool.query('TRUNCATE mlb_predictions;');

    // 3. Loop through games and insert into DB
    for (const game of response.data) {
      const fanduel = game.bookmakers.find(b => b.key === 'fanduel');
      if (!fanduel) continue;

      const outcomes = fanduel.markets[0].outcomes;
      const home = outcomes.find(o => o.name === game.home_team);
      const away = outcomes.find(o => o.name === game.away_team);

      await pool.query(
        `INSERT INTO mlb_predictions 
        (home_team, away_team, home_win_prob, away_win_prob, home_odds_fanduel, away_odds_fanduel, prediction_date) 
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)`,
        [game.home_team, game.away_team, 50.0, 50.0, home.price, away.price]
      );
    }
    console.log(`Updated ${response.data.length} games at ${new Date().toLocaleTimeString()}`);
  } catch (error) {
    console.error('Update failed:', error.message);
  } finally {
    process.exit();
  }
}

updateOdds();