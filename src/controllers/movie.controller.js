const Movie = require('../models/movie.model');

exports.createMovie = async (req, res) => {
    try {
        const movie = await Movie.createMovie(req.body);
        res.status(201).json(movie);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateMovie = async (req, res) => {
    try {
        const { id } = req.params;
        const movie = await Movie.updateMovie(id, req.body);
        
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        
        res.json(movie);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteMovie = async (req, res) => {
    try {
        const { id } = req.params;
        const movie = await Movie.deleteMovie(id);
        
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        
        res.json({ message: 'Movie deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMovieById = async (req, res) => {
    try {
        const { id } = req.params;
        const movie = await Movie.findById(id);

        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        res.json(movie);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMovieByTitle = async (req, res) => {
    try {
        const { title } = req.query;
        
        if (!title) {
            return res.status(400).json({ message: 'Title parameter is required' });
        }
        
        const movies = await Movie.getMovieByTitle(title);
        res.json(movies);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMovieByCategories = async (req, res) => {
    try {
        const { categories } = req.query;
        
        if (!categories) {
            return res.status(400).json({ message: 'Categories parameter is required' });
        }
        
        const categoriesArray = Array.isArray(categories) ? categories : categories.split(',');
        const movies = await Movie.getMovieByCategories(categoriesArray);
        res.json(movies);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMovieByRecent = async (req, res) => {
    try {
        const { limit } = req.query;
        const movies = await Movie.getMovieByRecent(limit ? parseInt(limit) : 10);
        res.json(movies);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};