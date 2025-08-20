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
async function autocompleteService(query, limit = 10) {
  try {
    console.log('🔍 [search.service.js] autocompleteService 함수 시작');
    console.log('📝 입력 파라미터:', { query, limit });

    const qn = norm(query);
    console.log('🔤 정규화된 쿼리:', qn);
    
    if (!qn) {
      console.log('❌ 정규화된 쿼리가 비어있음, 빈 배열 반환');
      return [];
    }

    const conds = [{ key_norm: { $regex: '^' + escapeRegex(qn) } }];
    console.log('🔍 기본 검색 조건:', conds[0]);

    if (isKoreanQuery(query)) {
      console.log('🇰🇷 한국어 쿼리 감지됨');
      const qi = toInitials(query);
      console.log('🔤 초성 변환 결과:', qi);
      if (qi) {
        conds.push({ key_initials: { $regex: '^' + escapeRegex(qi) } });
        console.log('➕ 초성 검색 조건 추가:', conds[1]);
      }
    }

    console.log('🔍 최종 검색 조건:', conds);
    console.log('📊 MongoDB 쿼리 실행 중...');

    const candidates = await SearchKey.find({ $or: conds })
      .limit(100) // 후보 제한
      .lean();

    console.log('📊 MongoDB 쿼리 결과:', {
      candidatesCount: candidates.length,
      firstCandidate: candidates[0] || 'none'
    });

    if (candidates.length === 0) {
      console.log('❌ 후보가 없음, 빈 배열 반환');
      return [];
    }

    // Fuse 재정렬(오타 허용)
    console.log('🔧 Fuse 검색 시작...');
    const fuse = new Fuse(candidates, fuseOptions);
    console.log('⚙️ Fuse 인스턴스 생성 완료');

    const fuseResults = fuse.search(query, { limit });
    console.log('🎯 Fuse 검색 결과:', {
      resultsCount: fuseResults.length,
      firstResult: fuseResults[0] || 'none'
    });

    const ranked = fuseResults.map(r => ({ 
      key: r.item.key_display, 
      movieIds: r.item.movieIds, 
      score: r.score 
    }));
    console.log('📋 Fuse 결과 매핑 완료:', ranked.length, '개');

    // Fuse 결과가 너무 적으면 prefix 상위로 보충
    if (ranked.length < limit) {
      console.log('📈 결과 부족, prefix 결과로 보충 중...');
      const seen = new Set(ranked.map(r => r.key));
      let addedCount = 0;
      
      for (const c of candidates) {
        if (seen.has(c.key_display)) continue;
        ranked.push({ key: c.key_display, movieIds: c.movieIds, score: null });
        addedCount++;
        if (ranked.length >= limit) break;
      }
      console.log('➕ 추가된 결과:', addedCount, '개');
    }

    const finalResults = ranked.slice(0, limit);
    console.log('✅ 최종 결과:', {
      count: finalResults.length,
      results: finalResults
    });

    return finalResults;

  } catch (error) {
    console.error('💥 [search.service.js] autocompleteService 함수에서 오류 발생:');
    console.error('❌ 오류 메시지:', error.message);
    console.error('📍 스택 트레이스:', error.stack);
    console.error('📝 입력값:', { query, limit });
    
    // 오류 발생 시 빈 배열 반환하거나 오류를 다시 던질 수 있습니다
    throw error; // 오류를 상위로 전파
  }
}

module.exports = { autocompleteService };