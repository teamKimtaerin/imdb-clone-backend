const Movie = require('../models/movie.model');
const { upsertForMovie, removeForMovie, cleanupOrphans } = require('../services/build-search-keys');

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
                // 평점 우선 정렬: 평점(35%) + 리뷰수 가중치(15%) + 최신도(50%)
                sortOption = { 
                    $expr: {
                        $add: [
                            // 평점 평균 (35%) - rating_total을 review_count로 나누어 실제 평균 계산
                            { $multiply: [
                                { $cond: [
                                    { $gt: ["$review_count", 0] },
                                    { $divide: ["$rating_total", "$review_count"] },
                                    0
                                ]},
                                0.35
                            ]},
                            // 리뷰 수 가중치 (15%) - 패널티 완화
                            { $multiply: [
                                { $cond: [
                                    { $gte: ["$review_count", 2] }, // 최소 2개 리뷰로 완화
                                    { $min: [
                                        { $ln: { $add: ["$review_count", 1] } }, // 자연로그로 완만한 증가
                                        3 // 최대 3점까지만
                                    ]},
                                    { $multiply: ["$review_count", 0.6] } // 패널티 더 완화
                                ]},
                                0.15
                            ]},
                            // 최신도 가중치 (50%) - 최신 영화 우선
                            { $multiply: [
                                { $cond: [
                                    { $gte: ["$release_date", new Date("2000-01-01")] }, // 2000년 이후로 기준
                                    { $min: [
                                        { $divide: [
                                            { $subtract: [
                                                { $year: "$release_date" },
                                                2000 // 2000년을 기준으로
                                            ]}, 
                                            25 // 25년으로 나누어 적절한 증가
                                        ]},
                                        1 // 최대 1점까지만
                                    ]},
                                    // 2000년 이전 영화는 연도에 따라 점진적 감소
                                    { $max: [
                                        { $divide: [
                                            { $subtract: [
                                                { $year: "$release_date" },
                                                1970 // 1970년을 기준점으로
                                            ]}, 
                                            30 // 30년으로 나누어 완만한 감소
                                        ]},
                                        0.05 // 최소 0.05점으로 더 낮게
                                    ]}
                                ]},
                                0.5 // 가중치 최대 증가 (0.3 → 0.5)
                            ]}
                        ]
                    }
                };
                break;
            case 'recent':
                sortOption = { release_date: -1 };
                break;
            case 'rating':
                // 평점순 정렬도 올바른 평균 계산으로 수정
                sortOption = { 
                    $expr: {
                        $cond: [
                            { $gt: ["$review_count", 0] },
                            { $divide: ["$rating_total", "$review_count"] },
                            0
                        ]
                    }
                };
                break;
                break;
            default:
                sortOption = { created_at: -1 };
        }
        
        const movies = await Movie.getMoviesWithPagination(query, sortOption, skip, limitNum);
        
        // 디버깅: 상위 5개 영화의 점수 계산 로그
        if (sort === 'popular' && pageNum === 1) {
            console.log('🎯 Popular 정렬 결과 (상위 5개):');
            movies.slice(0, 5).forEach((movie, index) => {
                const avgRating = movie.review_count > 0 ? movie.rating_total / movie.review_count : 0;
                const reviewScore = movie.review_count >= 2 
                    ? Math.min(Math.log(movie.review_count + 1), 3) * 0.15
                    : movie.review_count * 0.6 * 0.15;
                
                const releaseYear = new Date(movie.release_date).getFullYear();
                let yearScore;
                if (releaseYear >= 2000) {
                    yearScore = Math.min((releaseYear - 2000) / 25, 1) * 0.5;
                } else {
                    yearScore = Math.max((releaseYear - 1970) / 30, 0.05) * 0.5;
                }
                
                const totalScore = (avgRating * 0.35) + reviewScore + yearScore;
                
                console.log(`${index + 1}. ${movie.title} (${releaseYear})`);
                console.log(`   평점: ${avgRating.toFixed(1)} (${movie.review_count}개) → ${(avgRating * 0.35).toFixed(3)}점`);
                console.log(`   리뷰: ${reviewScore.toFixed(3)}점`);
                console.log(`   연도: ${yearScore.toFixed(3)}점`);
                console.log(`   총점: ${totalScore.toFixed(3)}점\n`);
            });
        }
        
        res.json(movies);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createMovie = async (req, res) => {
    try {
        const movie = await Movie.createMovie(req.body);
        
        // SearchKey 동기화 - 새로 생성된 영화만 대상으로
        try {
            await upsertForMovie(movie);
        } catch (e) {
            console.error('[upsertForMovie(create)] failed:', e);
        }
        
        res.status(201).json(movie);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateMovie = async (req, res) => {
    try {
        const { id } = req.params;
        const prevMovie = await Movie.findById(id);
        const movie = await Movie.updateMovie(id, req.body);
        
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        // SearchKey 동기화: 이전 상태 키 제거 -> 새 상태 업서트 -> 고아 키 정리
        try {
            await removeForMovie(prevMovie);
            await upsertForMovie(movie);
            await cleanupOrphans();
        } catch (e) {
            console.error('[search-keys sync on update] failed:', e);
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
        
        try {
            await removeForMovie(movie);
            await cleanupOrphans();
        } catch (e) {
            console.error('[search-keys cleanup on delete] failed:', e);
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