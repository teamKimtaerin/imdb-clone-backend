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
  age_rating: { type: String, default: 'ALL' }, // 시청 등급: ALL, 12, 15, 18 등
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
    // 기존: 카테고리 중 하나라도 포함하는 영화 검색 (OR 조건)
    // return await this.find({ categories: { $in: categories } }).sort({ created_at: -1 });
    
    // 수정: 모든 카테고리를 포함하는 영화만 검색 (AND 조건)
    return await this.find({ categories: { $all: categories } }).sort({ created_at: -1 });
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

movieSchema.statics.getMoviesWithPagination = async function(query = {}, sortOption = {}, skip = 0, limit = 20) {
  try {
    if (sortOption.$expr) {
      // MongoDB aggregation을 사용한 복잡한 정렬
      const pipeline = [
        { $match: query },
        { $addFields: { 
          calculatedSort: sortOption.$expr 
        }},
        { $sort: { calculatedSort: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $unset: "calculatedSort" }
      ];
      return await this.aggregate(pipeline);
    } else {
      // 일반 정렬
      return await this.find(query).sort(sortOption).skip(skip).limit(limit);
    }
  } catch (error) {
    throw error;
  }
};

const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie;
