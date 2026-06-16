const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// .env 파일에서 API 키 읽기
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const OPENAI_API_KEY = envContent.match(/API_KEY=(.+)/)?.[1]?.trim();

if (!OPENAI_API_KEY) {
  console.error('.env 파일에 API_KEY가 없습니다.');
  process.exit(1);
}

const SYSTEM_PROMPT = `너는 재미있고 센스 있는 별명(닉네임) 생성 전문가야.
사용자가 이름, 성격, 취미, 특징 등의 정보를 주면 그에 맞는 창의적인 별명을 만들어줘.

규칙:
- 별명을 5개 생성해
- 각 별명에 짧은 설명(왜 이 별명인지)을 붙여
- 재미있고 긍정적인 별명으로 만들어
- 한국어와 영어 별명을 섞어서 만들어
- 응답은 아래 JSON 형식으로만 해 (다른 텍스트 없이):
[
  { "nickname": "별명", "reason": "이유" },
  { "nickname": "별명", "reason": "이유" }
]`;

function callOpenAI(userMessage) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 500,
      temperature: 0.9,
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error.message));
          } else {
            resolve(json.choices[0].message.content);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 별명 생성 API
  if (req.method === 'POST' && req.url === '/api/nickname') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { name, personality, hobby, feature } = JSON.parse(body);

        let prompt = `이름: ${name || '없음'}`;
        if (personality) prompt += `\n성격: ${personality}`;
        if (hobby) prompt += `\n취미: ${hobby}`;
        if (feature) prompt += `\n특징: ${feature}`;
        prompt += '\n\n이 정보를 바탕으로 별명을 만들어줘!';

        const answer = await callOpenAI(prompt);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ nicknames: answer }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Static files
  const filePath = req.url === '/' ? 'index.html' : req.url.slice(1);
  const fullPath = path.join(__dirname, filePath);
  const ext = path.extname(fullPath);

  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
  };

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`AI 별명 생성기 서버: http://localhost:${PORT}`);
});
