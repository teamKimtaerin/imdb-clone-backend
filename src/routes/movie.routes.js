const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movie.controller');

/**
 * @swagger
 * /api/movies:
 *   get:
 *     summary: 영화 목록 조회 (페이지네이션, 카테고리 필터, 인기도 정렬 지원)
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 페이지당 영화 수
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *         description: 카테고리 필터 (쉼표로 구분)
 *         example: "액션,드라마"
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [popular, recent, rating]
 *           default: popular
 *         description: 정렬 기준
 *     responses:
 *       200:
 *         description: 영화 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Movie'
 */
router.get('/', movieController.getMovies);

/**
 * @swagger
 * /api/movies:
 *   post:
 *     summary: 영화 생성
 *     tags: [Movies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MovieRequest'
 *     responses:
 *       201:
 *         description: 영화 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Movie'
 *       400:
 *         description: 잘못된 요청
 */
router.post('/', movieController.createMovie);

/**
 * @swagger
 * /api/movies/{id}:
 *   put:
 *     summary: 영화 정보 수정
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 영화 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MovieRequest'
 *     responses:
 *       200:
 *         description: 영화 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Movie'
 *       404:
 *         description: 영화를 찾을 수 없음
 */
router.put('/:id', movieController.updateMovie);

/**
 * @swagger
 * /api/movies/{id}:
 *   delete:
 *     summary: 영화 삭제
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 영화 ID
 *     responses:
 *       200:
 *         description: 영화 삭제 성공
 *       404:
 *         description: 영화를 찾을 수 없음
 */
router.delete('/:id', movieController.deleteMovie);

/**
 * @swagger
 * /api/movies/search/title:
 *   get:
 *     summary: 제목으로 영화 검색
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: title
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색할 영화 제목
 *     responses:
 *       200:
 *         description: 검색 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Movie'
 *       400:
 *         description: 제목 파라미터 필요
 */
router.get('/search/title', movieController.getMovieByTitle);

/**
 * @swagger
 * /api/movies/search/categories:
 *   get:
 *     summary: 카테고리로 영화 검색
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: categories
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색할 카테고리 (쉼표로 구분)
 *         example: "액션,드라마"
 *     responses:
 *       200:
 *         description: 검색 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Movie'
 *       400:
 *         description: 카테고리 파라미터 필요
 */
router.get('/search/categories', movieController.getMovieByCategories);

/**
 * @swagger
 * /api/movies/recent:
 *   get:
 *     summary: 최근 영화 목록 조회
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 조회할 영화 수
 *     responses:
 *       200:
 *         description: 최근 영화 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Movie'
 */
router.get('/recent', movieController.getMovieByRecent);

/**
 * @swagger
 * /api/movies/{id}:
 *   get:
 *     summary: 영화 상세 정보 조회
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 영화 ID
 *     responses:
 *       200:
 *         description: 영화 상세 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Movie'
 *       404:
 *         description: 영화를 찾을 수 없음
 */
router.get('/:id', movieController.getMovieById);

module.exports = router;