const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    title: String,
    rating: Number,
    content: String,
    is_spoiler: Boolean,

    user: {
        user_id: mongoose.Schema.Types.ObjectId,
        nickname: String
    },

    movie: {
        movie_id: mongoose.Schema.Types.ObjectId,
        release_date: Date,
        running_time: Number
    },

    created_at: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;