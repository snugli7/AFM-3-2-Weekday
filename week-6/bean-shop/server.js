const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

const SECRET_KEY = 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6';

// PostgreSQL (Supabase Pooler) 연결
const pool = new Pool({
  connectionString: 'postgresql://postgres.kydkqdkcxrqnazbqnyty:ylJu4pLeSmTf47wg@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
});

app.use(express.static(path.join(__dirname)));

// 결제 승인 API
app.get('/api/payments/confirm', async (req, res) => {
  const { paymentKey, orderId, amount } = req.query;

  if (!paymentKey || !orderId || !amount) {
    return res.status(400).json({ error: true, message: '필수 파라미터가 누락되었습니다.' });
  }

  try {
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: Number(amount),
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('결제 승인 성공:', data.orderId, data.totalAmount + '원');

      // DB에 주문 저장
      try {
        await pool.query(
          `INSERT INTO orders (order_id, payment_key, order_name, method, total_amount, status, approved_at, receipt_url, raw_data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (order_id) DO NOTHING`,
          [
            data.orderId,
            data.paymentKey,
            data.orderName,
            data.method,
            data.totalAmount,
            data.status,
            data.approvedAt,
            data.receipt?.url || null,
            JSON.stringify(data),
          ]
        );
        console.log('주문 DB 저장 완료:', data.orderId);
      } catch (dbErr) {
        console.error('DB 저장 실패:', dbErr.message);
      }

      res.json(data);
    } else {
      console.error('결제 승인 실패:', data.code, data.message);
      res.status(response.status).json({ error: true, code: data.code, message: data.message });
    }
  } catch (err) {
    console.error('서버 오류:', err);
    res.status(500).json({ error: true, message: '서버 오류가 발생했습니다.' });
  }
});

// 주문 내역 조회 API
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, order_id, order_name, method, total_amount, status, approved_at, created_at FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('주문 조회 실패:', err.message);
    res.status(500).json({ error: true, message: '주문 조회에 실패했습니다.' });
  }
});

app.listen(PORT, () => {
  console.log(`ORIGIN 커피숍 서버 실행 중: http://localhost:${PORT}`);
});
