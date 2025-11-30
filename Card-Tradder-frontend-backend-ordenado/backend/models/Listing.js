// models/Listing.js
const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    cardId: { type: String, required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
    price: Number,
    condition: String,
    images: [String],
    createdAt: { type: Date, default: Date.now }
});

// Importante: aquí NO se genera faker, NO se ejecutan funciones, SÓLO se declara el modelo.

module.exports = mongoose.model('Listing', listingSchema);
