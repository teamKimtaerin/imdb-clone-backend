// src/services/kor-norm.js
const { getChoseong, disassemble } = require('es-hangul');

/** 검색용 정규화: 전각/호환 문자 통일, 소문자, 공백 축약 */
function norm(s) {
  return (s ?? '')
    .toString()
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** 한글 전체 자모열로 분해 (겹자모도 분리). 비한글 문자는 그대로 유지
 *  출력은 반드시 호환 자모(ㄱ-ㅎ, ㅏ-ㅣ)로 통일한다. */
function toJamoFull(s) {
  const input = (s ?? '')
    .toString()
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
  if (!input) return '';

  // 1) es-hangul로 1차 분해 (현대 자모 영역으로 나옴: ᄀ/ᅡ/ᆨ 등)
  let raw;
  try {
    raw = disassemble(input);
  } catch {
    // 실패 시 입력을 그대로 반환 (상위 로직에서 접두 매칭에 사용)
    return input;
  }

  // 2) 현대 자모 → 호환 자모 변환 테이블 (겹자모는 완전히 분해)
  const CHO_MAP = {
    'ᄀ': 'ㄱ','ᄁ': 'ㄲ','ᄂ': 'ㄴ','ᄃ': 'ㄷ','ᄄ': 'ㄸ','ᄅ': 'ㄹ','ᄆ': 'ㅁ','ᄇ': 'ㅂ','ᄈ': 'ㅃ','ᄉ': 'ㅅ','ᄊ': 'ㅆ','ᄋ': 'ㅇ','ᄌ': 'ㅈ','ᄍ': 'ㅉ','ᄎ': 'ㅊ','ᄏ': 'ㅋ','ᄐ': 'ㅌ','ᄑ': 'ㅍ','ᄒ': 'ㅎ'
  };
  const JUNG_MAP = {
    'ᅡ': 'ㅏ','ᅢ': 'ㅐ','ᅣ': 'ㅑ','ᅤ': 'ㅒ','ᅥ': 'ㅓ','ᅦ': 'ㅔ','ᅧ': 'ㅕ','ᅨ': 'ㅖ','ᅩ': 'ㅗ','ᅪ': 'ㅗㅏ','ᅫ': 'ㅗㅐ','ᅬ': 'ㅗㅣ','ᅭ': 'ㅛ','ᅮ': 'ㅜ','ᅯ': 'ㅜㅓ','ᅰ': 'ㅜㅔ','ᅱ': 'ㅜㅣ','ᅲ': 'ㅠ','ᅳ': 'ㅡ','ᅴ': 'ㅡㅣ','ᅵ': 'ㅣ'
  };
  const JONG_MAP = {
    'ᆨ': 'ㄱ','ᆩ': 'ㄲ','ᆪ': 'ㄱㅅ','ᆫ': 'ㄴ','ᆬ': 'ㄴㅈ','ᆭ': 'ㄴㅎ','ᆮ': 'ㄷ','ᆯ': 'ㄹ','ᆰ': 'ㄹㄱ','ᆱ': 'ㄹㅁ','ᆲ': 'ㄹㅂ','ᆳ': 'ㄹㅅ','ᆴ': 'ㄹㅌ','ᆵ': 'ㄹㅍ','ᆶ': 'ㄹㅎ','ᆷ': 'ㅁ','ᆸ': 'ㅂ','ᆹ': 'ㅂㅅ','ᆺ': 'ㅅ','ᆻ': 'ㅆ','ᆼ': 'ㅇ','ᆽ': 'ㅈ','ᆾ': 'ㅊ','ᆿ': 'ㅋ','ᇀ': 'ㅌ','ᇁ': 'ㅍ','ᇂ': 'ㅎ'
  };

  // 3) 문자 단위 변환: 현대 자모 → 호환 자모, 그 외(이미 호환 자모/영문/숫자/공백)는 그대로
  let out = '';
  for (const ch of raw) {
    if (CHO_MAP[ch]) { out += CHO_MAP[ch]; continue; }
    if (JUNG_MAP[ch]) { out += JUNG_MAP[ch]; continue; }
    if (JONG_MAP[ch]) { out += JONG_MAP[ch]; continue; }
    out += ch;
  }

  return out.replace(/\s+/g, '');
}

/** 한글 문자열의 초성만 추출 (공백 등 비한글은 위치 유지) */
function toInitials(s) {
  const input = (s ?? '').toString();
  if (!input) return '';
  try {
    // 예: '사과' -> 'ㅅㄱ', '띄어 쓰기' -> 'ㄸㅇ ㅆㄱ'
    return getChoseong(input).replace(/\s+/g, '');
  } catch {
    // 실패 시 원문 반환(서비스 지속성 우선)
    return input.replace(/\s+/g, '');
  }
}

/** 질의 문자열에 한글(자모/호환자모/가~힣)이 포함되는지 */
function isKoreanQuery(s) {
  const str = (s ?? '').toString();
  if (!str) return false;
  //한글인지 유니코드로 체크
  return /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/.test(str);
}

/** 정규식 특수문자 이스케이프 */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { norm, toInitials, toJamoFull, isKoreanQuery, escapeRegex };