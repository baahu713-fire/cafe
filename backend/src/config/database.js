const { Pool } = require('pg');

// Use the connection string from Supabase dashboard
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // store in .env
  ssl: {
    rejectUnauthorized: false, // Supabase requires SSL
  },
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool,
};


// const pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'lunch_ordering',
//   password: 'password',
//   port: 5432,
// });

// module.exports = {
//   query: (text, params) => pool.query(text, params),
// };
