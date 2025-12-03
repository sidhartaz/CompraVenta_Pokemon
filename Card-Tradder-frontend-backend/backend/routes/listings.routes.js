const express = require('express');
const { authRequired, requireRole } = require('../middlewares/auth');
const {
  createListing,
  deleteListing,
  getApprovedListings,
  getFeaturedListing,
  getListingById,
  getListingContact,
  getMyListings,
  updateListing,
} = require('../controllers/listingController');

const router = express.Router();

router.get('/', getApprovedListings);
router.get('/mine', authRequired, requireRole('vendedor'), getMyListings);
router.get('/featured', getFeaturedListing);
router.get('/:id', getListingById);
router.get('/:id/contact', authRequired, getListingContact);
router.post('/', authRequired, requireRole('vendedor'), createListing);
router.put('/:id', authRequired, requireRole('vendedor'), updateListing);
router.delete('/:id', authRequired, requireRole('vendedor'), deleteListing);

module.exports = router;
