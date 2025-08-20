const SearchKey = require('../models/search-key.model');
const mongoose = require('mongoose');
const { norm, toInitials } = require('./kor-norm');

async function buildFromMovies(MovieModel) {
  // 모든 영화에서 title, director, cast.name을 키로 사용
  const cursor = MovieModel.find({}, { title:1, director:1, cast:1 }).cursor();

  const map = new Map(); // key_display -> Set<ObjectId>
  for await (const m of cursor) {
    const id = m._id;
    const keys = new Set();
    if (m.title)    keys.add(m.title);
    if (m.director) keys.add(m.director);
    if (Array.isArray(m.cast)) {
      for (const c of m.cast) if (c?.name) keys.add(c.name);
    }
    for (const k of keys) {
      if (!k) continue;
      if (!map.has(k)) map.set(k, new Set());
      map.get(k).add(id);
    }
  }

  // bulk upsert
  const ops = [];
  for (const [keyDisplay, idSet] of map.entries()) {
    const key_norm = norm(keyDisplay);
    const key_initials = toInitials(keyDisplay);
    ops.push({
      updateOne: {
        filter: { key_display: keyDisplay },
        update: {
          $set: { key_display: keyDisplay, key_norm, key_initials },
          $addToSet: { movieIds: { $each: [...idSet] } }
        },
        upsert: true
      }
    });
  }
  if (ops.length) await SearchKey.bulkWrite(ops);
  return { keys: ops.length };
}

module.exports = { buildFromMovies };