// src/services/korNorm.js
const { disassemble, isHangul } = require('es-hangul');

function norm(s) {
  return (s ?? '')
    .toString()
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

// 한글 음절의 "초성"만 추출
function toInitials(s) {
  const arr = disassemble(s ?? '', { grouped: true }); // [[초,중,종], ' ', ...]
  return arr.map(g => Array.isArray(g) && g.length ? g[0] : g).join('');
}

function isKoreanQuery(s) {
  return [...(s ?? '')].some(ch => isHangul(ch));
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { norm, toInitials, isKoreanQuery, escapeRegex };