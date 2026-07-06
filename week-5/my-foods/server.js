require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || '').trim(),
  ssl: { rejectUnauthorized: false },
});

const openai = new OpenAI({ apiKey: (process.env.OPENAI_API_KEY || '').trim() });

// ========================================
// DB 초기화 - Lazy Init 패턴
// ========================================
let dbInitialized = false;

async function initDB() {
  if (dbInitialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '기타',
      quantity NUMERIC NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT '개',
      added_date DATE NOT NULL DEFAULT CURRENT_DATE,
      estimated_expiry DATE NOT NULL,
      storage_method TEXT NOT NULL DEFAULT '냉장',
      memo TEXT DEFAULT ''
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      recipe_name TEXT NOT NULL,
      description TEXT DEFAULT '',
      difficulty TEXT NOT NULL DEFAULT '쉬움',
      cooking_time INTEGER NOT NULL DEFAULT 0,
      servings INTEGER NOT NULL DEFAULT 2,
      available_ingredients JSONB DEFAULT '[]',
      missing_ingredients JSONB DEFAULT '[]',
      steps JSONB DEFAULT '[]',
      tips JSONB DEFAULT '[]',
      match_rate INTEGER DEFAULT 50
    );
  `);

  dbInitialized = true;
  console.log('DB tables ready');
}

// API 라우트 앞에 미들웨어로 적용
app.use('/api', async (_req, _res, next) => {
  try {
    await initDB();
    next();
  } catch (err) {
    next(err);
  }
});

// ========================================
// 재료 API
// ========================================

// 전체 조회
app.get('/api/ingredients', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM ingredients ORDER BY name');
    const ingredients = rows.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      quantity: Number(r.quantity),
      unit: r.unit,
      addedDate: r.added_date?.toISOString().split('T')[0],
      estimatedExpiry: r.estimated_expiry?.toISOString().split('T')[0],
      storageMethod: r.storage_method,
      memo: r.memo || '',
    }));
    res.json(ingredients);
  } catch (err) {
    console.error('GET /api/ingredients error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 추가
app.post('/api/ingredients', async (req, res) => {
  try {
    const { id, name, category, quantity, unit, addedDate, estimatedExpiry, storageMethod, memo } = req.body;
    await pool.query(
      `INSERT INTO ingredients (id, name, category, quantity, unit, added_date, estimated_expiry, storage_method, memo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, name, category, quantity, unit, addedDate, estimatedExpiry, storageMethod, memo || '']
    );
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/ingredients error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 수정
app.put('/api/ingredients/:id', async (req, res) => {
  try {
    const { name, category, quantity, unit, addedDate, estimatedExpiry, storageMethod, memo } = req.body;
    await pool.query(
      `UPDATE ingredients SET name=$1, category=$2, quantity=$3, unit=$4, added_date=$5, estimated_expiry=$6, storage_method=$7, memo=$8
       WHERE id=$9`,
      [name, category, quantity, unit, addedDate, estimatedExpiry, storageMethod, memo || '', req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/ingredients error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 삭제
app.delete('/api/ingredients/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM ingredients WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/ingredients error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ========================================
// 레시피 API
// ========================================

// 전체 조회
app.get('/api/recipes', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM recipes ORDER BY recipe_name');
    const recipes = rows.map(r => ({
      id: r.id,
      recipeName: r.recipe_name,
      description: r.description,
      difficulty: r.difficulty,
      cookingTime: r.cooking_time,
      servings: r.servings,
      availableIngredients: r.available_ingredients,
      missingIngredients: r.missing_ingredients,
      steps: r.steps,
      tips: r.tips,
      matchRate: r.match_rate,
    }));
    res.json(recipes);
  } catch (err) {
    console.error('GET /api/recipes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 추가
app.post('/api/recipes', async (req, res) => {
  try {
    const { id, recipeName, description, difficulty, cookingTime, servings, availableIngredients, missingIngredients, steps, tips, matchRate } = req.body;
    await pool.query(
      `INSERT INTO recipes (id, recipe_name, description, difficulty, cooking_time, servings, available_ingredients, missing_ingredients, steps, tips, match_rate)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id, recipeName, description, difficulty, cookingTime, servings,
       JSON.stringify(availableIngredients || []),
       JSON.stringify(missingIngredients || []),
       JSON.stringify(steps || []),
       JSON.stringify(tips || []),
       matchRate || 50]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/recipes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 수정
app.put('/api/recipes/:id', async (req, res) => {
  try {
    const { recipeName, description, difficulty, cookingTime, servings, availableIngredients, missingIngredients, steps, tips, matchRate } = req.body;
    await pool.query(
      `UPDATE recipes SET recipe_name=$1, description=$2, difficulty=$3, cooking_time=$4, servings=$5,
       available_ingredients=$6, missing_ingredients=$7, steps=$8, tips=$9, match_rate=$10
       WHERE id=$11`,
      [recipeName, description, difficulty, cookingTime, servings,
       JSON.stringify(availableIngredients || []),
       JSON.stringify(missingIngredients || []),
       JSON.stringify(steps || []),
       JSON.stringify(tips || []),
       matchRate || 50, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/recipes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 삭제
app.delete('/api/recipes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM recipes WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/recipes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ========================================
// 할 일 API
// ========================================

// 전체 조회
app.get('/api/todos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/todos error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 추가
app.post('/api/todos', async (req, res) => {
  try {
    const { id, title } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO todos (id, title) VALUES ($1, $2) RETURNING *',
      [id, title]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('POST /api/todos error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 수정 (완료 토글 / 제목 수정)
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { title, completed } = req.body;
    const { rows } = await pool.query(
      'UPDATE todos SET title = COALESCE($1, title), completed = COALESCE($2, completed) WHERE id = $3 RETURNING *',
      [title, completed, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Todo not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/todos error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 삭제
app.delete('/api/todos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM todos WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/todos error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ========================================
// AI 레시피 생성 API
// ========================================
app.post('/api/ai/generate-recipe', async (req, res) => {
  try {
    const { ingredients } = req.body;
    if (!ingredients || !ingredients.length) {
      return res.status(400).json({ error: '재료를 입력해주세요.' });
    }

    const ingredientList = ingredients.map(i => `${i.name} (${i.quantity}${i.unit})`).join(', ');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.8,
      messages: [
        {
          role: 'system',
          content: `당신은 한국 가정식 요리 전문가입니다. 사용자가 제공한 냉장고 재료를 기반으로 레시피를 생성합니다.
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "recipeName": "레시피 이름",
  "description": "레시피 설명 (1~2문장)",
  "difficulty": "쉬움" | "보통" | "어려움",
  "cookingTime": 숫자(분),
  "servings": 숫자(인분),
  "availableIngredients": [{"name": "재료명", "amount": "양"}],
  "missingIngredients": [{"name": "재료명", "amount": "양", "essential": true/false}],
  "steps": [{"step": 1, "instruction": "설명", "duration": "시간"}],
  "tips": ["팁1", "팁2"],
  "matchRate": 숫자(0~100)
}`
        },
        {
          role: 'user',
          content: `다음 냉장고 재료로 만들 수 있는 맛있는 레시피 1개를 추천해주세요:\n${ingredientList}\n\n가능한 보유 재료를 최대한 활용하고, 부족한 기본 양념만 missingIngredients에 포함해주세요. matchRate는 보유 재료 활용 비율입니다.`
        }
      ]
    });

    const content = completion.choices[0].message.content.trim();
    // JSON 파싱 (마크다운 코드블록 감싸진 경우 처리)
    const jsonStr = content.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    const recipe = JSON.parse(jsonStr);

    res.json(recipe);
  } catch (err) {
    console.error('AI recipe generation error:', err);
    res.status(500).json({ error: 'AI 레시피 생성에 실패했습니다: ' + err.message });
  }
});

// ========================================
// SPA fallback (Express 5 문법)
// ========================================
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ========================================
// 서버 시작 (Local + Vercel Dual-Mode)
// ========================================
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
module.exports = app;
