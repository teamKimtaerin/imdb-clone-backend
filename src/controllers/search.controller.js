// src/controllers/search.controller.js
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