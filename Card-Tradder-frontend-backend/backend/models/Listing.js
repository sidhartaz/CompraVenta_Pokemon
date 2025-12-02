const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  // Referencia a la carta (id proveniente de la colección Card)
  cardId: { type: String, required: true },

  // Usuario vendedor que publica la carta
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Datos de la publicación
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  condition: { type: String, required: true },
  description: { type: String },
  imageData: { type: String },

  // Estado de validación por parte de admin
  status: {
    type: String,
    enum: ['pendiente', 'aprobada', 'rechazada'],
    default: 'pendiente',
  },
  rejectionReason: { type: String },

  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Listing', listingSchema);
