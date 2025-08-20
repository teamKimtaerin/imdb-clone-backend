const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');

/**
 * @swagger
 * /api/reviews/movie/{movieId}:
 *   get:
 *     summary: 특정 영화의 모든 리뷰 조회
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *         description: 영화 ID
 *     responses:
 *       200:
 *         description: 리뷰 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *                 totalReviews:
 *                   type: integer
 *       500:
 *         description: 서버 오류
 */
router.get('/movie/:movieId', reviewController.getReviewsByMovieId);

/**
 * @swagger
 * /api/reviews/movie/{movieId}:
 *   post:
 *     summary: 리뷰 작성
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *         description: 영화 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewRequest'
 *     responses:
 *       201:
 *         description: 리뷰 작성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: 이미 리뷰 작성됨 또는 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post('/movie/:movieId', reviewController.createReview);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   put:
 *     summary: 리뷰 수정
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: 리뷰 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewUpdateRequest'
 *     responses:
 *       200:
 *         description: 리뷰 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       404:
 *         description: 리뷰를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.put('/:reviewId', reviewController.updateReview);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   delete:
 *     summary: 리뷰 삭제
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: 리뷰 ID
 *     responses:
 *       200:
 *         description: 리뷰 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "리뷰가 성공적으로 삭제되었습니다."
 *       404:
 *         description: 리뷰를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.delete('/:reviewId', reviewController.deleteReview);

/**
 * @swagger
 * /api/reviews/user/{userId}:
 *   get:
 *     summary: 사용자별 리뷰 조회
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 사용자 리뷰 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *                 totalReviews:
 *                   type: integer
 *       500:
 *         description: 서버 오류
 */
router.get('/user/:userId', reviewController.getReviewsByUserId);

module.exports = router;