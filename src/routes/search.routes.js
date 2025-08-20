// src/routes/search.routes.js

/**
 * @swagger
 * tags:
 *   - name: Search
 *     description: 검색 API
 */

/**
 * @swagger
 * /api/search:
 *   get:
 *     tags:
 *       - Search
 *     summary: 자동완성 검색 결과 반환
 *     description: "q 쿼리에 기반한 key_display 자동완성 결과를 반환합니다."
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: "검색할 텍스트 (예시: 전/초성 또는 전체 단어)"
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: "결과 개수 제한 (1~50)"
 *     responses:
 *       200:
 *         description: 검색 결과 리스트
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 query:
 *                   type: string
 *                   example: "인터스텔라"
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       key:
 *                         type: string
 *                         example: "인터스텔라"
 *                       movieIds:
 *                         type: array
 *                         items:
 *                           type: string
 *                           example: 68a583862e82ca12bce32741
 *                       score:
 *                         type: number
 *                         nullable: true
 *                         example: 0.125
 *       500:
 *         description: 서버 오류 또는 검색 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "SEARCH_FAILED"
 */
const router = require('express').Router();
const searchController = require('../controllers/search.controller');

router.get('/', searchController.autocomplete);

module.exports = router;