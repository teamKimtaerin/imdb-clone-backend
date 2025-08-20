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

/** 한글 전체 자모열로 분해 (겹자모도 분리). 비한글 문자는 그대로 유지 */
function toJamoFull(s) {
  const input = (s ?? '')
    .toString()
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
  if (!input) return '';
  try {
    // 예: '값이 비싸다' -> 'ㄱㅏㅂㅅㅇㅣ ㅂㅣㅆㅏㄷㅏ'
    //     'ㅘ' -> 'ㅗㅏ', 'ㄵ' -> 'ㄴㅈ'
    return disassemble(input);
  } catch {
    // 실패 시 입력을 그대로 반환(서비스 지속성 우선)
    return input;
  }
}

/** 한글 문자열의 초성만 추출 (공백 등 비한글은 위치 유지) */
function toInitials(s) {
  const input = (s ?? '').toString();
  if (!input) return '';
  try {
    // 예: '사과' -> 'ㅅㄱ', '띄어 쓰기' -> 'ㄸㅇ ㅆㄱ'
    return getChoseong(input);
  } catch {
    // 실패 시 원문 반환(서비스 지속성 우선)
    return input;
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