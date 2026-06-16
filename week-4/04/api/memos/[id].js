const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    await pool.query('DELETE FROM memos WHERE id = $1', [id]);
    return res.json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
