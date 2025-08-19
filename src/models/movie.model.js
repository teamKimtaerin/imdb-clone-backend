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

movieSchema.statics.createMovie = async function(movieData) {
  try {
    const movie = new this(movieData);
    return await movie.save();
  } catch (error) {
    throw error;
  }
};

movieSchema.statics.updateMovie = async function(id, updateData) {
  try {
    return await this.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  } catch (error) {
    throw error;
  }
};

movieSchema.statics.deleteMovie = async function(id) {
  try {
    return await this.findByIdAndDelete(id);
  } catch (error) {
    throw error;
  }
};

movieSchema.statics.getMovieByTitle = async function(title) {
  try {
    return await this.find({ title: { $regex: title, $options: 'i' } }).sort({ created_at: -1 });
  } catch (error) {
    throw error;
  }
};

movieSchema.statics.getMovieByCategories = async function(categories) {
  try {
    return await this.find({ categories: { $in: categories } }).sort({ created_at: -1 });
  } catch (error) {
    throw error;
  }
};

movieSchema.statics.getMovieByRecent = async function(limit = 10) {
  try {
    return await this.find().sort({ created_at: -1 }).limit(limit);
  } catch (error) {
    throw error;
  }
};

const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie;
