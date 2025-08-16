const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 4000;

// DB 연결 후 서버 실행
connectDB();

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
