require('dotenv').config(); // 환경 변수 로드
const express = require('express');
const cors = require('cors');

const {swaggerUi, swaggerSpec} = require('./config/swagger');
const userRoutes = require('./routes/user.routes');
const movieRoutes = require('./routes/movie.routes');
const reviewRoutes = require('./routes/review.routes');
const authRoutes = require('./routes/auth.routes');
const searchRoutes = require('./routes/search.routes');


const app = express();

// 미들웨어
app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 라우터 등록

app.use('/api/movies', movieRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);

app.get('/', (req, res) => {
    res.json({
        message: "IMDB Clone API Server",
        documentation: 'http://localhost:4000/api-docs'
    });
})

app.use((req, res, next) => {
    res.status(404).send({error: 'Not Found'});
})

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({error: 'Something went wrong!'});
})


module.exports = app;
