require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('../models/movie.model');

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/imdb_clone');
        console.log('MongoDB 연결 성공');
    } catch (error) {
        console.error('MongoDB 연결 실패:', error);
        process.exit(1);
    }
}

async function removeDuplicateMovies() {
    console.log('중복 영화 검사 및 제거 시작...\n');
    
    await connectDB();
    
    try {
        // 제목, 개봉일, 러닝타임이 같은 영화들을 그룹화하여 찾기
        const duplicates = await Movie.aggregate([
            {
                $group: {
                    _id: {
                        title: "$title",
                        release_date: "$release_date",
                        running_time: "$running_time"
                    },
                    movies: { $push: "$$ROOT" },
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);

        if (duplicates.length === 0) {
            console.log('✅ 중복된 영화가 없습니다.');
            return;
        }

        console.log(`⚠️  ${duplicates.length}개의 중복 그룹을 발견했습니다.\n`);

        let totalRemoved = 0;

        for (const duplicate of duplicates) {
            const { title, release_date, running_time } = duplicate._id;
            const movies = duplicate.movies;
            
            console.log(`🎬 "${title}" (${new Date(release_date).getFullYear()}, ${running_time}분)`);
            console.log(`   - 중복 개수: ${movies.length}개`);
            
            // 첫 번째 영화를 제외한 나머지 삭제 (가장 먼저 생성된 것 유지)
            const moviesToKeep = movies.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            const movieToKeep = moviesToKeep[0];
            const moviesToRemove = moviesToKeep.slice(1);
            
            console.log(`   - 유지할 영화 ID: ${movieToKeep._id}`);
            console.log(`   - 삭제할 영화 개수: ${moviesToRemove.length}개`);
            
            // 중복 영화들 삭제
            for (const movieToRemove of moviesToRemove) {
                await Movie.findByIdAndDelete(movieToRemove._id);
                totalRemoved++;
            }
            
            console.log(`   ✅ 삭제 완료\n`);
        }

        console.log(`🎉 중복 제거 완료!`);
        console.log(`총 ${totalRemoved}개의 중복 영화가 제거되었습니다.`);
        
        // 현재 영화 수 확인
        const remainingCount = await Movie.countDocuments();
        console.log(`현재 남아있는 영화 수: ${remainingCount}개`);

    } catch (error) {
        console.error('중복 제거 중 오류 발생:', error);
        throw error;
    } finally {
        mongoose.connection.close();
    }
}

if (require.main === module) {
    removeDuplicateMovies().catch(error => {
        console.error('스크립트 실행 중 오류 발생:', error);
        process.exit(1);
    });
}

module.exports = { removeDuplicateMovies };