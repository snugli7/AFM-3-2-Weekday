require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 테이블 생성
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS memos (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('DB 테이블 준비 완료');
}

// 메모 전체 조회
app.get('/api/memos', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM memos ORDER BY created_at DESC');
  res.json(rows);
});

// 메모 추가
app.post('/api/memos', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: '제목과 내용을 입력하세요' });
  const { rows } = await pool.query(
    'INSERT INTO memos (title, content) VALUES ($1, $2) RETURNING *',
    [title, content]
  );
  res.status(201).json(rows[0]);
});

// 메모 삭제
app.delete('/api/memos/:id', async (req, res) => {
  await pool.query('DELETE FROM memos WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// 정적 파일은 API 라우트 뒤에 배치
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
  });
});
