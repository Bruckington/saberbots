const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const games = [
  { home: 'Baltimore Orioles', away: 'New York Yankees', h_prob: 50.0, a_prob: 50.0 },
  { home: 'Cleveland Guardians', away: 'Los Angeles Angels', h_prob: 50.0, a_prob: 50.0 },
  { home: 'Pittsburgh Pirates', away: 'Colorado Rockies', h_prob: 50.0, a_prob: 50.0 },
  { home: 'Cincinnati Reds', away: 'Washington Nationals', h_prob: 50.0, a_prob: 50.0 },
  { home: 'Boston Red Sox', away: 'Philadelphia Phillies', h_prob: 50.0, a_prob: 50.0 },
  { home: 'Toronto Blue Jays', away: 'Tampa Bay Rays', h_prob: 50.0, a_prob: 50.0 },
  { home: 'New York Mets', away: 'Detroit Tigers', h_prob: 50.0, a_prob: 50.0 },
  { home: 'Atlanta Braves', away: 'Chicago Cubs', h_prob: 50.0, a_prob: 50.0 },
  { home: 'Chicago White Sox', away: 'Kansas City Royals', h_prob: 50.0, a_prob: 50.0 },
  { home: 'Minnesota Twins', away: 'Miami Marlins', h_prob: 50.0, a_prob: 50.0 },
  { home: 'Milwaukee Brewers', away: 'San Diego Padres', h_prob: 50.0, a_prob: 50.0 },
  { home: 'Texas Rangers', away: 'Arizona Diamondbacks', h_prob: 50.0, a_prob: 50.0 },
  { home: 'Houston Astros', away: 'Seattle Mariners', h_prob: 50.0, a_prob: 50.0 },
  { home: 'Athletics', away: 'St. Louis Cardinals', h_prob: 50.0, a_prob: 50.0 },
  { home: 'Los Angeles Dodgers', away: 'San Francisco Giants', h_prob: 50.0, a_prob: 50.0 }
];

async function seed() {
  await pool.query('TRUNCATE mlb_predictions;');
  for (const game of games) {
    await pool.query(
      'INSERT INTO mlb_predictions (home_team, away_team, home_win_prob, away_win_prob, prediction_date) VALUES ($1, $2, $3, $4, $5)',
      [game.home, game.away, game.h_prob, game.a_prob, '2026-05-13']
    );
  }
  console.log('Successfully seeded all 15 MLB games for today!');
  process.exit();
}

seed();