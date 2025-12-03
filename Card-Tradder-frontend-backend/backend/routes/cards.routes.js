const express = require('express');
const { autocompleteCards, getCardDetails, searchCards } = require('../controllers/cardController');
const { cacheCardsSearch } = require('../middlewares/cache');

const router = express.Router();

router.get('/search', cacheCardsSearch, searchCards);
router.get('/autocomplete', autocompleteCards);
router.get('/:id', getCardDetails);

module.exports = router;
