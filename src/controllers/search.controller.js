// src/controllers/search.controller.js
/**
 * NOTE: This controller is intentionally **read-only**.
 * - Search/autocomplete endpoints live here.
 * - SearchKey CRUD (create/update/delete) is handled as side-effects inside movie CRUD in `movie.controller.js`.
 *   Rationale: SearchKey는 Movie의 파생 데이터이므로 원천 데이터(Movie) 변경 시 함께 동기화하는 것이 일관성과 트랜잭션 경계를 유지하기 쉬움.
 */
const { autocomplete } = require('../services/search.service');

exports.autocomplete = async (req, res) => {
  try {
    const q = req.query.q ?? '';
    const limit = Math.min(parseInt(req.query.limit ?? '10', 10), 10);
    const items = await autocomplete(q, limit);
    res.json({ ok: true, query: q, count: items.length, items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'SEARCH_FAILED' });
  }
};