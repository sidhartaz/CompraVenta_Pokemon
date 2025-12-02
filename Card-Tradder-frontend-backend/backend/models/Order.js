const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pendiente', 'reservada', 'pagada', 'cancelada'],
      required: true,
    },
    note: { type: String },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    cardId: { type: String, required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['compra', 'reserva'], default: 'compra' },
    status: {
      type: String,
      enum: ['pendiente', 'reservada', 'pagada', 'cancelada'],
      default: 'pendiente',
    },
    total: { type: Number },
    history: { type: [historySchema], default: [] },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
