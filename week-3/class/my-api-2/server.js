const http = require("http");

const PORT = 3000;

const greetings = [
  "안녕하세요! 오늘도 좋은 하루 보내세요 😊",
  "반갑습니다! 즐거운 하루 되세요 🌟",
  "어서오세요! 행복한 시간 보내세요 💫",
  "환영합니다! 오늘 하루도 화이팅 💪",
  "안녕하세요! 좋은 일만 가득하길 바랍니다 🍀",
];

const server = http.createServer((req, res) => {
  // CORS 허용
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/api/greeting") {
    const now = new Date();
    const timeString = now.toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const randomGreeting =
      greetings[Math.floor(Math.random() * greetings.length)];

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify({
        currentTime: timeString,
        greeting: randomGreeting,
        timestamp: now.toISOString(),
      })
    );
  } else {
    res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Not Found", path: req.url }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
  console.log(`📡 API 엔드포인트: http://localhost:${PORT}/api/greeting`);
});
