const SearchKey = require('../models/search-key.model');
const FuseLib = require('fuse.js');
const Fuse = FuseLib.default || FuseLib;
const { norm, toInitials, isKoreanQuery, escapeRegex } = require('./kor-norm');

const fuseOptions = {
  keys: ['key_display'],
  includeScore: true,
  threshold: 0.3,
  ignoreLocation: true,
  minMatchCharLength: 1
};

// prefix 후보 + Fuse 재정렬
async function autocomplete(query, limit = 10) {
  const qn = norm(query);
  if (!qn) return [];

  const conds = [{ key_norm: { $regex: '^' + escapeRegex(qn) } }];
  if (isKoreanQuery(query)) {
    const qi = toInitials(query);
    if (qi) conds.push({ key_initials: { $regex: '^' + escapeRegex(qi) } });
  }

  const candidates = await SearchKey.find({ $or: conds })
    .limit(100) // 후보 제한
    .lean();

  // Fuse 재정렬(오타 허용)
  const fuse = new Fuse(candidates, fuseOptions);
  const ranked = fuse.search(query, { limit })
    .map(r => ({ key: r.item.key_display, movieIds: r.item.movieIds, score: r.score }));

  // Fuse 결과가 너무 적으면 prefix 상위로 보충
  if (ranked.length < limit) {
    const seen = new Set(ranked.map(r => r.key));
    for (const c of candidates) {
      if (seen.has(c.key_display)) continue;
      ranked.push({ key: c.key_display, movieIds: c.movieIds, score: null });
      if (ranked.length >= limit) break;
    }
  }
  return ranked.slice(0, limit);
}

module.exports = { autocomplete };