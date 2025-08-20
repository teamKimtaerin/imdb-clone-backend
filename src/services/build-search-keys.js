const SearchKey = require('../models/search-key.model');
const { norm, toInitials, toJamoFull } = require('./kor-norm');

// --- internal helper: extract key strings + type from a Movie document ---
function extractKeysFromMovie(m) {
  const out = [];
  if (!m) return out;
  if (m.title) out.push({ keyDisplay: m.title, key_type: 'movie' });
  if (m.director) out.push({ keyDisplay: m.director, key_type: 'director' });
  if (Array.isArray(m.cast)) {
    for (const c of m.cast) if (c?.name) out.push({ keyDisplay: c.name, key_type: 'actor' });
  }
  return out;
}

// --- public: upsert search-keys for a single movie document ---
async function upsertForMovie(movie) {
  if (!movie?._id) return;
  const id = movie._id;
  const keys = extractKeysFromMovie(movie);
  const ops = [];
  for (const { keyDisplay, key_type } of keys) {
    const key_norm = norm(keyDisplay);
    const key_initials = toInitials(keyDisplay);
    const key_jamo_full = toJamoFull(keyDisplay);
    ops.push({
      updateOne: {
        filter: { key_display: keyDisplay, key_type },
        update: {
          $set: { key_display: keyDisplay, key_type, key_norm, key_initials, key_jamo_full },
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
  for (const { keyDisplay, key_type } of keys) {
    ops.push({
      updateOne: {
        filter: { key_display: keyDisplay, key_type },
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

  // composite key: `${type}::${display}` -> Set<ObjectId>
  const map = new Map();
  const meta = new Map(); // compositeKey -> { keyDisplay, key_type }
  for await (const m of cursor) {
    const id = m._id;
    const items = extractKeysFromMovie(m);
    for (const { keyDisplay, key_type } of items) {
      const comp = `${key_type}::${keyDisplay}`;
      if (!map.has(comp)) {
        map.set(comp, new Set());
        meta.set(comp, { keyDisplay, key_type });
      }
      map.get(comp).add(id);
    }
  }

  // bulk upsert
  const ops = [];
  for (const [comp, idSet] of map.entries()) {
    const { keyDisplay, key_type } = meta.get(comp);
    const key_norm = norm(keyDisplay);
    const key_initials = toInitials(keyDisplay);
    const key_jamo_full = toJamoFull(keyDisplay);
    ops.push({
      updateOne: {
        filter: { key_display: keyDisplay, key_type },
        update: {
          $set: { key_display: keyDisplay, key_type, key_norm, key_initials, key_jamo_full },
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