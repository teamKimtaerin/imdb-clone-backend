const Review = require('../models/review.model');
const Movie = require('../models/movie.model');

// 영화의 별점 합계와 리뷰 수 업데이트 함수
const updateMovieRating = async (movieId) => {
    try {
        const reviews = await Review.find({ "movie.movie_id": movieId });
        const reviewCount = reviews.length;
        
        if (reviewCount === 0) {
            // 리뷰가 없으면 0으로 설정
            await Movie.findByIdAndUpdate(movieId, {
                rating_total: 0,
                review_count: 0
            });
        } else {
            // 별점 합계 계산 (평균이 아닌 합계!)
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            
            await Movie.findByIdAndUpdate(movieId, {
                rating_total: totalRating, // 합계 저장
                review_count: reviewCount
            });
        }
    } catch (error) {
        console.error('영화 별점 합계 업데이트 실패:', error);
    }
};

exports.getReviewsByMovieId = async (req, res) => {
    try {
        const { movieId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        const reviews = await Review.find({ "movie.movie_id": movieId })
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limitNum);
            
        const totalReviews = await Review.countDocuments({ "movie.movie_id": movieId });
        const hasMore = skip + reviews.length < totalReviews;

        res.json({
            reviews,
            totalReviews,
            hasMore
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.createReview = async (req, res) => {
    try {
        const { movieId } = req.params;
        const { userId, nickname, title, rating, content, comment, is_spoiler } = req.body;

        const existingReview = await Review.findOne({
            "movie.movie_id": movieId,
            "user.user_id": userId
        });

        if (existingReview) {
            return res.status(400).json({
                error: '이미 이 영화에 대한 리뷰를 작성하셨습니다.'
            });
        }

        const newReview = new Review({
            title: title || "리뷰", // title이 없으면 기본값
            rating,
            content: content || comment, // content 또는 comment 필드 사용
            is_spoiler: is_spoiler || false,
            user: {
                user_id: userId,
                nickname: nickname || "익명" // nickname이 없으면 기본값
            },
            movie: {
                movie_id: movieId
                // 필요하면 나중에 영화 정보 추가
            },
            created_at: new Date()
        });

        await newReview.save();
        
        // 영화 별점 합계 업데이트
        await updateMovieRating(movieId);

        res.status(201).json(newReview);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { title, rating, content, is_spoiler } = req.body;

        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            {
                title,
                rating,
                content,
                is_spoiler
            },
            { new: true }
        );

        if (!updatedReview) {
            return res.status(404).json({ error: '리뷰를 찾을 수 없습니다.' });
        }
        
        // 영화 별점 합계 업데이트
        await updateMovieRating(updatedReview.movie.movie_id);

        res.json(updatedReview);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const deletedReview = await Review.findByIdAndDelete(reviewId);

        if (!deletedReview) {
            return res.status(404).json({ error: '리뷰를 찾을 수 없습니다.' });
        }
        
        // 영화 별점 합계 업데이트
        await updateMovieRating(deletedReview.movie.movie_id);

        res.json({ message: '리뷰가 성공적으로 삭제되었습니다.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getReviewsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        const reviews = await Review.find({ "user.user_id": userId })
            .sort({ created_at: -1 });

        const total = await Review.countDocuments({ "user.user_id": userId });

        res.json({
            reviews,
            totalReviews: total
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};