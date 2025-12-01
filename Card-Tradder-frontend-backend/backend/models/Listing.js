const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  // carta asociada, si usas un modelo Card:
  card: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },

  // dueño de la publicación
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // estado de validación
  status: {
    type: String,
    enum: ['pendiente', 'aprobada', 'rechazada'],
    default: 'pendiente'
  },

  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Listing', listingSchema);
