const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: 'postgresql://postgres.dayxkawcbhbkvjseojha:u4NS0eIJ031iHtTt@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
});

// 테이블 생성
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      completed BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('todos 테이블 준비 완료');
}

// 전체 조회
app.get('/api/todos', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
  res.json(rows);
});

// 추가
app.post('/api/todos', async (req, res) => {
  const { text } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO todos (text) VALUES ($1) RETURNING *',
    [text]
  );
  res.json(rows[0]);
});

// 완료 토글
app.patch('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    'UPDATE todos SET completed = NOT completed WHERE id = $1 RETURNING *',
    [id]
  );
  res.json(rows[0]);
});

// 삭제
app.delete('/api/todos/:id', async (req, res) => {
  await pool.query('DELETE FROM todos WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// 완료 항목 일괄 삭제
app.delete('/api/todos', async (req, res) => {
  await pool.query('DELETE FROM todos WHERE completed = true');
  res.json({ success: true });
});

const PORT = 3000;

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
  });
});
