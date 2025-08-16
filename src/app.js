const express = require('express');
const cors = require('cors');

const userRoutes = require('./routes/user.routes');

const app = express();

// 미들웨어
app.use(cors());
app.use(express.json());

// 라우터 등록
app.use('/api/users', userRoutes);

module.exports = app;

