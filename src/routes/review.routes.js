const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');

// 특정 영화의 모든 리뷰 조회
router.get('/movie/:movieId', reviewController.getReviewsByMovieId);

// 리뷰 작성
router.post('/movie/:movieId', reviewController.createReview);

// 리뷰 수정
router.put('/:reviewId', reviewController.updateReview);

// 리뷰 삭제
router.delete('/:reviewId', reviewController.deleteReview);

// 사용자별 리뷰 조회
router.get('/user/:userId', reviewController.getReviewsByUserId);

module.exports = router;