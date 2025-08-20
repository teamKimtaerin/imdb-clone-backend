const Movie = require('../models/movie.model');

exports.getMovies = async (req, res) => {
    try {
        const { page = 1, limit = 20, categories, sort = 'popular' } = req.query;
        
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        let query = {
            age_rating: { $ne: 'NR' } // NR 등급 영화는 제외
        };
        
        // 카테고리 필터링 - 선택된 모든 카테고리를 포함하는 영화만
        if (categories) {
            const categoriesArray = Array.isArray(categories) ? categories : categories.split(',');
            query.categories = { $all: categoriesArray };
        }
        
        let sortOption = {};
        
        // 정렬 옵션
        switch (sort) {
            case 'popular':
                // 인기도: 평점 평균 + 관객 수 + 리뷰 수 + 최신도를 종합한 점수
                sortOption = { 
                    $expr: {
                        $add: [
                            // 평점 평균 (40%) - rating_total이 이미 평균값
                            { $multiply: ["$rating_total", 0.4] },
                            // 관객 수 (30%)
                            { $multiply: [{ $divide: ["$audience", 1000000] }, 0.3] },
                            // 리뷰 수 (15%)
                            { $multiply: ["$review_count", 0.15] },
                            // 최신도 - 2020년 이후 영화에 보너스 점수 (15%)
                            { $multiply: [
                                { $cond: [
                                    { $gte: ["$release_date", new Date("2010-01-01")] },
                                    { $divide: [
                                        { $subtract: [
                                            { $year: "$release_date" },
                                            2010
                                        ]}, 
                                        4
                                    ]},
                                    0
                                ]},
                                0.15
                            ]}
                        ]
                    }
                };
                break;
            case 'recent':
                sortOption = { release_date: -1 };
                break;
            case 'rating':
                sortOption = { rating_total: -1 };
                break;
            default:
                sortOption = { created_at: -1 };
        }
        
        const movies = await Movie.getMoviesWithPagination(query, sortOption, skip, limitNum);
        res.json(movies);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createMovie = async (req, res) => {
    try {
        const movie = await Movie.createMovie(req.body);
        res.status(201).json(movie);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateMovie = async (req, res) => {
    try {
        const { id } = req.params;
        const movie = await Movie.updateMovie(id, req.body);
        
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        
        res.json(movie);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteMovie = async (req, res) => {
    try {
        const { id } = req.params;
        const movie = await Movie.deleteMovie(id);
        
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        
        res.json({ message: 'Movie deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMovieById = async (req, res) => {
    try {
        const { id } = req.params;
        const movie = await Movie.findById(id);

        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        res.json(movie);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMovieByTitle = async (req, res) => {
    try {
        const { title } = req.query;
        
        if (!title) {
            return res.status(400).json({ message: 'Title parameter is required' });
        }
        
        const movies = await Movie.getMovieByTitle(title);
        // NR 등급 영화 필터링
        const filteredMovies = movies.filter(movie => movie.age_rating !== 'NR');
        res.json(filteredMovies);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMovieByCategories = async (req, res) => {
    try {
        const { categories } = req.query;
        
        if (!categories) {
            return res.status(400).json({ message: 'Categories parameter is required' });
        }
        
        const categoriesArray = Array.isArray(categories) ? categories : categories.split(',');
        const movies = await Movie.getMovieByCategories(categoriesArray);
        // NR 등급 영화 필터링
        const filteredMovies = movies.filter(movie => movie.age_rating !== 'NR');
        res.json(filteredMovies);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMovieByRecent = async (req, res) => {
    try {
        const { limit } = req.query;
        const movies = await Movie.getMovieByRecent(limit ? parseInt(limit) : 10);
        // NR 등급 영화 필터링
        const filteredMovies = movies.filter(movie => movie.age_rating !== 'NR');
        res.json(filteredMovies);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};