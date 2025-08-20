const SearchKey = require('../models/search-key.model');
const { norm, toInitials } = require('./kor-norm');

// --- internal helper: extract key strings from a Movie document ---
function extractKeysFromMovie(m) {
  const keys = new Set();
  if (!m) return keys;
  if (m.title) keys.add(m.title);
  if (m.director) keys.add(m.director);
  if (Array.isArray(m.cast)) {
    for (const c of m.cast) if (c?.name) keys.add(c.name);
  }
  return keys;
}

// --- public: upsert search-keys for a single movie document ---
async function upsertForMovie(movie) {
  if (!movie?._id) return;
  const id = movie._id;
  const keys = extractKeysFromMovie(movie);
  const ops = [];
  for (const keyDisplay of keys) {
    const key_norm = norm(keyDisplay);
    const key_initials = toInitials(keyDisplay);
    ops.push({
      updateOne: {
        filter: { key_display: keyDisplay },
        update: {
          $set: { key_display: keyDisplay, key_norm, key_initials },
          $addToSet: { movieIds: id }
        },
        upsert: true
      }
    });
  }
  if (ops.length) await SearchKey.bulkWrite(ops);
}

// --- public: remove references of a single movie from search-keys ---
async function removeForMovie(movie) {
  if (!movie?._id) return;
  const id = movie._id;
  const keys = extractKeysFromMovie(movie);
  const ops = [];
  for (const keyDisplay of keys) {
    ops.push({
      updateOne: {
        filter: { key_display: keyDisplay },
        update: { $pull: { movieIds: id } }
      }
    });
  }
  if (ops.length) await SearchKey.bulkWrite(ops);
}

// --- public: delete search-keys that no longer reference any movies ---
async function cleanupOrphans() {
  await SearchKey.deleteMany({ $expr: { $eq: [ { $size: "$movieIds" }, 0 ] } });
}

// --- legacy: bulk (re)build from a MovieModel/cursor (kept for batch jobs) ---
async function buildFromMovies(MovieModel) {
  // 모든 영화에서 title, director, cast.name을 키로 사용
  const cursor = MovieModel.find({}, { title:1, director:1, cast:1 }).cursor();

  const map = new Map(); // key_display -> Set<ObjectId>
  for await (const m of cursor) {
    const id = m._id;
    const keys = extractKeysFromMovie(m);
    for (const k of keys) {
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

module.exports = { buildFromMovies, upsertForMovie, removeForMovie, cleanupOrphans };