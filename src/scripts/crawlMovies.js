require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const Movie = require('../models/movie.model');

const TMDB_API_KEY = process.env.TMDB_API_KEY || 'YOUR_TMDB_API_KEY';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/imdb_clone');
        console.log('MongoDB 연결 성공');
    } catch (error) {
        console.error('MongoDB 연결 실패:', error);
        process.exit(1);
    }
}

async function getPopularMovies(page = 1) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'ko-KR',
                page: page
            }
        });
        return response.data.results;
    } catch (error) {
        console.error('인기 영화 데이터 가져오기 실패:', error.message);
        return [];
    }
}

async function getMovieDetails(movieId) {
    try {
        const [movieResponse, creditsResponse, videosResponse] = await Promise.all([
            axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'ko-KR'
                }
            }),
            axios.get(`${TMDB_BASE_URL}/movie/${movieId}/credits`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'ko-KR'
                }
            }),
            axios.get(`${TMDB_BASE_URL}/movie/${movieId}/videos`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'ko-KR'
                }
            })
        ]);

        return {
            movie: movieResponse.data,
            credits: creditsResponse.data,
            videos: videosResponse.data
        };
    } catch (error) {
        console.error(`영화 ID ${movieId} 상세 정보 가져오기 실패:`, error.message);
        return null;
    }
}

function transformMovieData(movieData) {
    const { movie, credits, videos } = movieData;
    
    const trailer = videos.results.find(video => 
        video.type === 'Trailer' && video.site === 'YouTube'
    );
    
    const director = credits.crew.find(person => person.job === 'Director');
    
    const cast = credits.cast.slice(0, 10).map(actor => ({
        name: actor.name,
        role: actor.character || '배역 정보 없음'
    }));
    
    const categories = movie.genres.map(genre => genre.name);
    
    return {
        title: movie.title,
        categories: categories,
        running_time: movie.runtime || 0,
        release_date: new Date(movie.release_date),
        rating_total: Math.round(movie.vote_average * 10) / 10,
        review_count: movie.vote_count,
        audience: movie.popularity || 0,
        trailer_url: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
        description: movie.overview,
        cast: cast,
        director: director ? director.name : '감독 정보 없음',
        poster_url: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : null
    };
}

async function saveMovieToDatabase(movieData) {
    try {
        const existingMovie = await Movie.findOne({ title: movieData.title });
        if (existingMovie) {
            console.log(`영화 "${movieData.title}"는 이미 존재합니다.`);
            return false;
        }
        
        const newMovie = await Movie.createMovie(movieData);
        console.log(`영화 "${newMovie.title}" 저장 완료`);
        return true;
    } catch (error) {
        console.error(`영화 "${movieData.title}" 저장 실패:`, error.message);
        return false;
    }
}

async function crawlMovies(totalPages = 5) {
    console.log('영화 크롤링 시작...');
    
    if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
        console.error('TMDB API 키가 설정되지 않았습니다. .env 파일에 TMDB_API_KEY를 추가해주세요.');
        return;
    }
    
    await connectDB();
    
    let totalSaved = 0;
    let totalProcessed = 0;
    
    for (let page = 1; page <= totalPages; page++) {
        console.log(`\n페이지 ${page}/${totalPages} 처리 중...`);
        
        const movies = await getPopularMovies(page);
        
        for (const movie of movies) {
            totalProcessed++;
            console.log(`\n${totalProcessed}. "${movie.title}" 처리 중...`);
            
            const movieDetails = await getMovieDetails(movie.id);
            if (!movieDetails) {
                continue;
            }
            
            const transformedData = transformMovieData(movieDetails);
            const saved = await saveMovieToDatabase(transformedData);
            
            if (saved) {
                totalSaved++;
            }
            
            await new Promise(resolve => setTimeout(resolve, 250));
        }
    }
    
    console.log(`\n크롤링 완료!`);
    console.log(`총 처리된 영화: ${totalProcessed}개`);
    console.log(`저장된 영화: ${totalSaved}개`);
    console.log(`중복 건너뛴 영화: ${totalProcessed - totalSaved}개`);
    
    mongoose.connection.close();
}

if (require.main === module) {
    const pages = process.argv[2] ? parseInt(process.argv[2]) : 3;
    crawlMovies(pages).catch(error => {
        console.error('크롤링 중 오류 발생:', error);
        process.exit(1);
    });
}

module.exports = { crawlMovies };