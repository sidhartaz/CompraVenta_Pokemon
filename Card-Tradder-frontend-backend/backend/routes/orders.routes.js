const express = require('express');
const { authRequired } = require('../middlewares/auth');
const Listing = require('../models/Listing');
const Order = require('../models/Order');

const router = express.Router();

// Crear una orden o reserva
router.post('/', authRequired, async (req, res) => {
  try {
    const { listingId, type = 'compra', note } = req.body;

    if (!listingId) {
      return res.status(400).json({ message: 'listingId es obligatorio' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing no encontrado' });
    }

    if (listing.status !== 'aprobada') {
      return res.status(400).json({ message: 'La publicación debe estar aprobada para generar una orden' });
    }

    const normalizedType = type === 'reserva' ? 'reserva' : 'compra';
    const initialStatus = normalizedType === 'reserva' ? 'reservada' : 'pendiente';

    const order = await Order.create({
      listingId,
      cardId: listing.cardId,
      sellerId: listing.sellerId,
      buyerId: req.user.id,
      type: normalizedType,
      status: initialStatus,
      total: listing.price,
      history: [
        {
          status: initialStatus,
          note: note || (normalizedType === 'reserva' ? 'Reserva creada' : 'Orden creada'),
          changedBy: req.user.id,
        },
      ],
      notes: note,
    });

    await order
      .populate('buyerId', 'name email role')
      .populate('sellerId', 'name email role')
      .populate('listingId');

    return res.status(201).json({ order });
  } catch (err) {
    console.error('Error en POST /api/orders:', err);
    return res.status(500).json({ message: 'Error al crear la orden' });
  }
});

// Listar órdenes (según rol)
router.get('/', authRequired, async (req, res) => {
  try {
    const filter = {};
    const { status } = req.query;
    if (status) filter.status = status;

    if (req.user.role === 'admin') {
      // Sin filtro adicional
    } else if (req.user.role === 'vendedor') {
      filter.sellerId = req.user.id;
    } else {
      filter.buyerId = req.user.id;
    }

    const orders = await Order.find(filter)
      .populate('buyerId', 'name email role')
      .populate('sellerId', 'name email role')
      .populate('listingId')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ orders });
  } catch (err) {
    console.error('Error en GET /api/orders:', err);
    return res.status(500).json({ message: 'Error al listar órdenes' });
  }
});

// Detalle de una orden
router.get('/:id', authRequired, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyerId', 'name email role')
      .populate('sellerId', 'name email role')
      .populate('listingId')
      .lean();

    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });

    const isBuyer = order.buyerId?._id?.toString() === req.user.id;
    const isSeller = order.sellerId?._id?.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ message: 'No tienes permiso para ver esta orden' });
    }

    return res.json({ order });
  } catch (err) {
    console.error('Error en GET /api/orders/:id:', err);
    return res.status(500).json({ message: 'Error al obtener la orden' });
  }
});

// Actualizar estado (pago, cancelación, etc.)
router.patch('/:id/status', authRequired, async (req, res) => {
  try {
    const { status, note } = req.body;
    const allowedStatuses = ['pendiente', 'reservada', 'pagada', 'cancelada'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });

    const isSeller = order.sellerId.toString() === req.user.id;
    const isBuyer = order.buyerId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Solo el vendedor o admin pueden marcar pagada/reservada; comprador puede cancelar la suya
    if (!isAdmin && !isSeller) {
      if (!(isBuyer && status === 'cancelada')) {
        return res.status(403).json({ message: 'No tienes permiso para cambiar este estado' });
      }
    }

    order.status = status;
    order.history.push({
      status,
      note: note || `Estado actualizado a ${status}`,
      changedBy: req.user.id,
    });

    await order.save();

    await order
      .populate('buyerId', 'name email role')
      .populate('sellerId', 'name email role')
      .populate('listingId');

    return res.json({ order });
  } catch (err) {
    console.error('Error en PATCH /api/orders/:id/status:', err);
    return res.status(500).json({ message: 'Error al actualizar la orden' });
  }
});

module.exports = router;
