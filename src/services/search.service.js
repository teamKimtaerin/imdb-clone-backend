const SearchKey = require("../models/search-key.model");
const FuseLib = require("fuse.js");
const Fuse = FuseLib.default || FuseLib;
const { norm, toInitials, toJamoFull, isKoreanQuery, escapeRegex } = require("./kor-norm");

const fuseOptions = {
  keys: [
    { name: "key_norm", weight: 0.45 },
    { name: "key_jamo_full", weight: 0.30 },
    { name: "key_display", weight: 0.20 },
    { name: "key_initials", weight: 0.05 },
  ],
  includeScore: true,
  threshold: 0.35,
  ignoreLocation: false, // 위치 반영
  distance: 30, // 앞부분 매치에 유리
  minMatchCharLength: 1,
  useExtendedSearch: true,
};

// prefix 후보 + Fuse 재정렬
async function autocompleteService(query, limit = 10) {
  try {
    console.log("🔍 [search.service.js] 검색 시작:", { query, limit });

    const safeJamo = (item) => (item.key_jamo_full || toJamoFull(item.key_display || ''));
    const safeNorm = (item) => (item.key_norm || norm(item.key_display || ''));

    const qn = norm(query);

    if (!qn) {
      return [];
    }

    const qj = toJamoFull(query); // 전체 자모열
    const qi = isKoreanQuery(query) ? toInitials(query) : null;

    const conds = [
      { key_norm: { $regex: "^" + escapeRegex(qn) } },
    ];

    // 자모 prefix는 항상 함께 사용 (비한글 포함 시에도 안전)
    if (qj && qj.length >= 2) {
      conds.push({ key_jamo_full: { $regex: "^" + escapeRegex(qj) } });
    }

    // 초성 prefix는 2자 이상일 때만 사용 (과매치 방지)
    if (isKoreanQuery(query)) {
      if (qi && qi.length >= 2) {
        conds.push({ key_initials: { $regex: "^" + escapeRegex(qi) } });
      }
    }

    // 우선순위별(정규화 > 자모 > 초성)로 별도 쿼리 실행 후 병합하여 OR+limit 편향 제거
    const CAP = Math.max(50, limit * 10);

    const reNorm = new RegExp('^' + escapeRegex(qn));
    const reJamo = (qj && qj.length >= 2) ? new RegExp('^' + escapeRegex(qj)) : null;
    const reInit = (qi && qi.length >= 2) ? new RegExp('^' + escapeRegex(qi)) : null;

    const [normDocs, jamoDocs, initDocs] = await Promise.all([
      SearchKey.find({ key_norm: reNorm }).limit(CAP).lean(),
      reJamo ? SearchKey.find({ key_jamo_full: reJamo }).limit(CAP).lean() : Promise.resolve([]),
      reInit ? SearchKey.find({ key_initials: reInit }).limit(CAP).lean() : Promise.resolve([]),
    ]);

    // 우선순위 순서로 중복 제거 병합 (key_type + key_display 기준)
    const seenComp = new Set();
    const merged = [];
    const pushUnique = (arr) => {
      for (const d of arr) {
        const comp = `${d.key_type || 'unknown'}::${d.key_display}`;
        if (seenComp.has(comp)) continue;
        seenComp.add(comp);
        merged.push(d);
      }
    };
    pushUnique(normDocs);
    pushUnique(jamoDocs);
    pushUnique(initDocs);

    const candidates = merged;

    if (candidates.length === 0) {
      return [];
    }

    // 매치 출처 태깅 (후처리 가중치에 사용)
    for (const c of candidates) {
      const byNorm = safeNorm(c).startsWith(qn);
      const byJamo = safeJamo(c).startsWith(qj);
      const byInit = qi && (c.key_initials || '').startsWith(qi);
      c._matchedBy = byNorm ? 'norm' : byJamo ? 'jamo' : byInit ? 'initials' : 'unknown';
      c._byNorm = !!byNorm;
      c._byJamo = !!byJamo;
      c._byInit = !!byInit;
    }

    // Fuse 재정렬(오타 허용)
    const fuse = new Fuse(candidates, fuseOptions);

    // 1) 키별 시작 앵커 우선 (norm → jamo → initials → display), Fuse 점수 활용
    const pushFuse = (arr, acc, need) => {
      const seen = new Set(acc.map((r) => r.item.key_display));
      for (const r of arr) {
        if (seen.has(r.item.key_display)) continue;
        acc.push(r);
        seen.add(r.item.key_display);
        if (acc.length >= need) break;
      }
    };

    let fuseResults = [];
    if (qn) pushFuse(fuse.search({ key_norm: "^" + qn }, { limit }), fuseResults, limit);
    if (fuseResults.length < limit && qj && qj.length >= 2) {
      pushFuse(fuse.search({ key_jamo_full: "^" + qj }, { limit }), fuseResults, limit);
    }
    if (fuseResults.length < limit && qi && qi.length >= 2) {
      pushFuse(fuse.search({ key_initials: "^" + qi }, { limit }), fuseResults, limit);
    }
    if (fuseResults.length < limit) {
      pushFuse(fuse.search({ key_display: "^" + query }, { limit }), fuseResults, limit);
    }
    // 2) 부족하면 일반 fuzzy로 보충
    if (fuseResults.length < limit) {
      pushFuse(fuse.search(query, { limit }), fuseResults, limit);
    }

    // 3) 후처리: 가중치 재점수화 (작을수록 좋게)
    const scored = fuseResults.map((r) => {
      // Fuse score: 0 (best) → 1 (worst)
      let s = r.score ?? 0.6;
      const item = r.item;

      // 소폭 보정: 접두 매치는 보너스(감점). 과도한 덮어쓰기 금지.
      if (safeNorm(item).startsWith(qn)) s -= 0.12;            // 정규화 prefix 보너스
      if (qj && safeJamo(item).startsWith(qj)) s -= 0.08;      // 자모 prefix 보너스
      if (qi && (item.key_initials || '').startsWith(qi)) s -= 0.04; // 초성 prefix 보너스
      if ((item.key_display || '').startsWith(query)) s -= 0.05;     // 표시 prefix 보너스

      if (s < 0) s = 0;
      return { key: item.key_display, movieIds: item.movieIds, _score: +s.toFixed(4) };
    });

    // 4) 후보 보충(중복 제외): 각 후보의 최고 매치 소스에 따른 점수로 일괄 보충
    if (scored.length < limit) {
      const seen = new Set(scored.map((x) => x.key));
      const sourceRank = { norm: 0, jamo: 1, initials: 2, display: 3, other: 9 };
      const baseScoreMap = { norm: 0.10, jamo: 0.20, initials: 0.30, display: 0.40, other: 0.90 };

      // 후보별 최고 소스 계산
      const chooseBestSource = (c) => {
        const byNorm = safeNorm(c).startsWith(qn);
        const byJamo = safeJamo(c).startsWith(qj);
        const byInit = qi && qi.length >= 2 && (c.key_initials || '').startsWith(qi);
        if (byNorm) return 'norm';
        if (byJamo) return 'jamo';
        if (byInit) return 'initials';
        if ((c.key_display || '').startsWith(query)) return 'display';
        return 'other';
      };

      // 모든 candidates를 순회하며 우선순위에 따라 추가
      const pending = [];
      for (const c of candidates) {
        if (seen.has(c.key_display)) continue;
        const src = chooseBestSource(c);
        const base = baseScoreMap[src] ?? 0.90;
        const eps = (src === 'norm' ? 0.0001 : src === 'jamo' ? 0.0002 : src === 'initials' ? 0.0003 : 0.0009);
        pending.push({ key: c.key_display, movieIds: c.movieIds, _score: base + eps, _source: src });
      }

      // 소스 우선순위 → 점수 → 키 길이로 안정 정렬 후 limit까지 보충
      pending.sort((a, b) => {
        const ra = sourceRank[a._source || 'other'] ?? 9;
        const rb = sourceRank[b._source || 'other'] ?? 9;
        if (ra !== rb) return ra - rb;
        if (a._score !== b._score) return a._score - b._score;
        return (a.key?.length || 999) - (b.key?.length || 999);
      });

      for (const p of pending) {
        if (seen.has(p.key)) continue;
        scored.push(p);
        seen.add(p.key);
        if (scored.length >= limit) break;
      }
    }

    scored.sort((a, b) => a._score - b._score);
    const sourceRank = { norm: 0, jamo: 1, initials: 2, display: 3, other: 9 };
    scored.sort((a, b) => {
      if (a._score !== b._score) return a._score - b._score;
      const ra = sourceRank[a._source || 'other'] ?? 9;
      const rb = sourceRank[b._source || 'other'] ?? 9;
      if (ra !== rb) return ra - rb;
      return (a.key?.length || 999) - (b.key?.length || 999);
    });

    const finalResults = scored.slice(0, limit).map(({ key, movieIds, _score, _source }) => ({
      key,
      movieIds,
      score: _score,
    }));
    console.log(
      "✅ [search.service.js] 검색 완료:",
      finalResults.length,
      "개 결과"
    );

    return finalResults;
  } catch (error) {
    console.error("💥 [search.service.js] 검색 오류:", error.message);
    throw error;
  }
}

module.exports = { autocompleteService };
