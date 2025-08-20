// src/models/searchKey.model.js
const mongoose = require('mongoose');

const SearchKeySchema = new mongoose.Schema({
  key_display: { type: String, required: true },   // 사용자에게 보여줄 원문
  key_type: { type: String, enum: ['movie','director','actor'], required: true }, // 검색 키 유형
  key_norm:    { type: String, index: true },      // NFKC+lower+space normalize
  key_jamo_full:{ type: String, required: true },    //한글 용 자모 분리 문자열 ㅇㅣㄴㅅㅏ...
  key_initials:{ type: String, index: true },      // 한글 용 초성 문자열
  movieIds:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie', index: true }]
}, { timestamps: true });

SearchKeySchema.index({ key_norm: 1 });
SearchKeySchema.index({ key_jamo_full: 1 });
SearchKeySchema.index({ key_initials: 1 });
SearchKeySchema.index({ key_display: 1, key_type: 1 }, { unique: true })

module.exports = mongoose.model('SearchKey', SearchKeySchema);