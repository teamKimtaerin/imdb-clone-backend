require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const Movie = require('../models/movie.model');
const movieController = require('../controllers/movie.controller');
const SearchKey = require('../models/search-key.model');

const TMDB_API_KEY = process.env.TMDB_API_KEY || 'YOUR_TMDB_API_KEY';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

function callController(ctrlFn, { body = {}, params = {}, query = {} } = {}) {
    return new Promise((resolve, reject) => {
        const req = { body, params, query };
        const res = {
            status(code) { this.statusCode = code; return this; },
            json(payload) { resolve(payload); },
        };
        Promise.resolve(ctrlFn(req, res)).catch(reject);
    });
}

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
        const [movieResponse, creditsResponse, videosResponse, releaseDatesResponse] = await Promise.all([
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
            }),
            axios.get(`${TMDB_BASE_URL}/movie/${movieId}/release_dates`, {
                params: {
                    api_key: TMDB_API_KEY
                }
            })
        ]);

        return {
            movie: movieResponse.data,
            credits: creditsResponse.data,
            videos: videosResponse.data,
            releaseDates: releaseDatesResponse.data
        };
    } catch (error) {
        console.error(`영화 ID ${movieId} 상세 정보 가져오기 실패:`, error.message);
        return null;
    }
}

function getAgeRating(releaseDates) {
    // 한국 등급 우선 확인
    const koreanRelease = releaseDates.results.find(country => country.iso_3166_1 === 'KR');
    if (koreanRelease && koreanRelease.release_dates.length > 0) {
        const certification = koreanRelease.release_dates[0].certification;
        if (certification) {
            // 한국 영화 등급 체계: ALL, 12, 15, 18
            switch (certification) {
                case '전체관람가':
                case 'ALL':
                    return 'ALL';
                case '12세이상관람가':
                case '12':
                    return '12';
                case '15세이상관람가':
                case '15':
                    return '15';
                case '청소년관람불가':
                case '18':
                    return '18';
                default:
                    return certification;
            }
        }
    }
    
    // 미국 등급으로 대체
    const usRelease = releaseDates.results.find(country => country.iso_3166_1 === 'US');
    if (usRelease && usRelease.release_dates.length > 0) {
        const certification = usRelease.release_dates[0].certification;
        if (certification) {
            // 미국 등급을 한국 등급으로 매핑
            switch (certification) {
                case 'G':
                case 'PG':
                    return 'ALL';
                case 'PG-13':
                    return '12';
                case 'R':
                    return '18';
                case 'NC-17':
                    return '18';
                default:
                    return 'ALL';
            }
        }
    }
    
    return 'ALL'; // 기본값
}

function transformMovieData(movieData) {
    const { movie, credits, videos, releaseDates } = movieData;
    
    const trailer = videos.results.find(video => 
        video.type === 'Trailer' && video.site === 'YouTube'
    );
    
    const director = credits.crew.find(person => person.job === 'Director');
    
    const cast = credits.cast.slice(0, 10).map(actor => ({
        name: actor.name,
        role: actor.character || '배역 정보 없음'
    }));
    
    const categories = movie.genres.map(genre => genre.name);
    const ageRating = getAgeRating(releaseDates);
    
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
        poster_url: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : null,
        age_rating: ageRating
    };
}

async function saveMovieToDatabase(movieData) {
    try {
        // 컨트롤러 경유: movie 생성 시 SearchKey도 함께 생성됨
        const created = await callController(movieController.createMovie, { body: movieData });
        return !!created; // 성공 시 true
    } catch (error) {
        console.error(`영화 "${movieData.title}" 저장 실패:`, error.message || error);
        return false;
    }
}

async function clearExistingMovies() {
    try {
        const movieDel = await Movie.deleteMany({});
        const keyDel = await SearchKey.deleteMany({});
        console.log(`기존 영화 ${movieDel.deletedCount}개, 검색키 ${keyDel.deletedCount}개 삭제 완료`);
        return movieDel.deletedCount;
    } catch (error) {
        console.error('기존 데이터 삭제 실패:', error.message);
        throw error;
    }
}

async function crawlMovies(targetMovieCount = 100) {
    console.log(`영화 크롤링 시작... (목표: ${targetMovieCount}개)`);
    
    if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
        console.error('TMDB API 키가 설정되지 않았습니다. .env 파일에 TMDB_API_KEY를 추가해주세요.');
        return;
    }
    
    await connectDB();
    
    // 기존 영화 데이터 삭제
    console.log('기존 영화 데이터를 삭제합니다...');
    await clearExistingMovies();
    
    let totalSaved = 0;
    let totalProcessed = 0;
    let page = 1;
    
    while (totalSaved < targetMovieCount) {
        console.log(`\n페이지 ${page} 처리 중... (저장된 영화: ${totalSaved}/${targetMovieCount})`);
        
        const movies = await getPopularMovies(page);
        
        if (movies.length === 0) {
            console.log('더 이상 가져올 영화가 없습니다.');
            break;
        }
        
        for (const movie of movies) {
            if (totalSaved >= targetMovieCount) {
                break;
            }
            
            totalProcessed++;
            console.log(`\n${totalProcessed}. "${movie.title}" 처리 중... (저장된 영화: ${totalSaved}/${targetMovieCount})`);
            
            const movieDetails = await getMovieDetails(movie.id);
            if (!movieDetails) {
                continue;
            }
            
            const transformedData = transformMovieData(movieDetails);
            const saved = await saveMovieToDatabase(transformedData);
            
            if (saved) {
                totalSaved++;
                console.log(`✅ "${transformedData.title}" 저장 완료 (${totalSaved}/${targetMovieCount})`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 250));
        }
        
        page++;
        
        if (page > 50) {
            console.log('최대 페이지 수에 도달했습니다.');
            break;
        }
    }
    
    console.log(`\n🎉 크롤링 완료!`);
    console.log(`총 처리된 영화: ${totalProcessed}개`);
    console.log(`저장된 영화: ${totalSaved}개`);
    console.log(`중복 건너뛴 영화: ${totalProcessed - totalSaved}개`);
    console.log(`목표 달성률: ${((totalSaved / targetMovieCount) * 100).toFixed(1)}%`);
    
    mongoose.connection.close();
}

if (require.main === module) {
    const movieCount = process.argv[2] ? parseInt(process.argv[2]) : 50;
    console.log(`크롤링할 영화 개수: ${movieCount}개`);
    crawlMovies(movieCount).catch(error => {
        console.error('크롤링 중 오류 발생:', error);
        process.exit(1);
    });
}

module.exports = { crawlMovies };