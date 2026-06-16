const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

let initialized = false;
async function initDB() {
  if (initialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS memos (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  initialized = true;
}

module.exports = async (req, res) => {
  await initDB();

  if (req.method === 'GET') {
    const { rows } = await pool.query('SELECT * FROM memos ORDER BY created_at DESC');
    return res.json(rows);
  }

  if (req.method === 'POST') {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: '제목과 내용을 입력하세요' });
    const { rows } = await pool.query(
      'INSERT INTO memos (title, content) VALUES ($1, $2) RETURNING *',
      [title, content]
    );
    return res.status(201).json(rows[0]);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
