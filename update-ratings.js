const mongoose = require('mongoose');
const Movie = require('./src/models/movie.model');
const Review = require('./src/models/review.model');

// MongoDB 연결
mongoose.connect('mongodb://localhost:27017/imdb_clone', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const updateAllMovieRatings = async () => {
  try {
    console.log('🎬 모든 영화의 별점 합계 업데이트 시작...');
    
    const movies = await Movie.find({});
    console.log(`📊 총 ${movies.length}개 영화 발견`);
    
    for (const movie of movies) {
      const reviews = await Review.find({ "movie.movie_id": movie._id });
      const reviewCount = reviews.length;
      
      if (reviewCount === 0) {
        await Movie.findByIdAndUpdate(movie._id, {
          rating_total: 0,
          review_count: 0
        });
        console.log(`📝 ${movie.title}: 리뷰 없음 (합계: 0, 개수: 0)`);
      } else {
        // 별점 합계 계산 (평균이 아닌 합계!)
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviewCount;
        
        await Movie.findByIdAndUpdate(movie._id, {
          rating_total: totalRating, // 합계 저장
          review_count: reviewCount
        });
        
        console.log(`⭐ ${movie.title}: 합계 ${totalRating}점 (평균 ${averageRating.toFixed(1)}점, ${reviewCount}개 리뷰)`);
      }
    }
    
    console.log('✅ 모든 영화의 별점 합계 업데이트 완료!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 업데이트 실패:', error);
    process.exit(1);
  }
};

updateAllMovieRatings();
