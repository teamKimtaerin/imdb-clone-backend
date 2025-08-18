const express = require('express');
const cors = require('cors');

const movieRoutes = require('./routes/movie.routes');

const app = express();

// 미들웨어
app.use(cors());
app.use(express.json());

// 라우터 등록
app.use('/api/movies', movieRoutes);

module.exports = app;