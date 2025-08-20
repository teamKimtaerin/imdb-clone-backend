// src/routes/search.routes.js
const router = require('express').Router();
const searchController = require('../controllers/search.controller');
router.get('/search', searchController.autocomplete);
module.exports = router;