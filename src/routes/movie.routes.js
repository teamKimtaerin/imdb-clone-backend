const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movie.controller');

router.post('/', movieController.createMovie);
router.put('/:id', movieController.updateMovie);
router.delete('/:id', movieController.deleteMovie);
router.get('/search/title', movieController.getMovieByTitle);
router.get('/search/categories', movieController.getMovieByCategories);
router.get('/recent', movieController.getMovieByRecent);
router.get('/:id', movieController.getMovieById);

module.exports = router;