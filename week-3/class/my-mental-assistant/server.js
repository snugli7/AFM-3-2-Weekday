const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `당신은 "마음 쉼터"의 전문 심리 상담사입니다. 따뜻하고 공감적인 태도로 내담자의 이야기를 경청하고, 심리적 안정감을 제공하세요.

상담 원칙:
1. 항상 공감과 경청을 먼저 하세요. 판단하거나 조언부터 하지 마세요.
2. 내담자의 감정을 반영하고 인정해 주세요.
3. 열린 질문을 통해 내담자가 스스로 생각을 정리할 수 있게 도와주세요.
4. 따뜻하고 부드러운 한국어를 사용하세요. 존댓말을 사용하세요.
5. 답변은 2~4문장 정도로 간결하게 하되, 진심이 담기게 하세요.
6. 자살, 자해 등 위기 상황이 감지되면 반드시 정신건강 위기상담전화 1393 또는 자살예방상담전화 1577-0199를 안내하세요.
7. 의학적 진단이나 처방은 하지 마세요. 필요 시 전문가 상담을 권유하세요.
8. 이모지는 사용하지 마세요.`;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Chat API - proxy to OpenAI
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'messages 배열이 필요합니다.' });
    }

    const openaiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      })),
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        temperature: 0.8,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', error);
      return res.status(response.status).json({
        success: false,
        message: error.error?.message || 'OpenAI API 요청 실패',
      });
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    res.json({ success: true, data: { text: reply } });
  } catch (err) {
    console.error('Chat API error:', err);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

// SPA fallback
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
module.exports = app;
