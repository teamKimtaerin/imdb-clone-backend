const mongoose = require('mongoose');

const castSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true }
}, { _id: false });

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  categories: { type: [String], required: true },
  running_time: { type: Number, required: true },
  release_date: { type: Date, required: true },
  rating_total: { type: Number, default: 0 },
  review_count: { type: Number, default: 0 },
  audience: { type: Number, default: 0 },
  trailer_url: { type: String },
  description: { type: String },
  cast: { type: [castSchema], default: [] },
  director: { type: String },
  poster_url: { type: String },
  created_at: { type: Date, default: Date.now }
});

const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie;
