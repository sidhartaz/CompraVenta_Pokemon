const express = require('express');
const { authRequired } = require('../middlewares/auth');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const Card = require('../models/Card');
const User = require('../models/User');

const router = express.Router();
const DAY_IN_MS = 24 * 60 * 60 * 1000;

async function expireOldReservations() {
  const expirationDate = new Date(Date.now() - DAY_IN_MS);
  const staleOrders = await Order.find({ status: 'reservada', createdAt: { $lt: expirationDate } });

  for (const order of staleOrders) {
    order.status = 'cancelada';
    order.history.push({
      status: 'cancelada',
      note: 'Reserva auto-cancelada por no confirmar pago en 24 horas',
      changedBy: order.sellerId,
    });
    order.notifications.push({
      type: 'cancelada',
      message: 'Reserva cancelada automáticamente por no confirmar el pago a tiempo.',
      recipient: 'buyer',
    });
    await order.save();
  }
}

async function attachCardData(orders) {
  const cardIds = [
    ...new Set(
      orders
        .map((order) => order.cardId)
        .filter(Boolean)
    ),
  ];

  if (!cardIds.length) return orders;

  const cards = await Card.find({ id: { $in: cardIds } }).lean();
  const cardMap = new Map(cards.map((card) => [card.id, card]));

  return orders.map((order) => ({
    ...order,
    card: cardMap.get(order.cardId) || null,
  }));
}

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

    const weekAgo = new Date(Date.now() - 7 * DAY_IN_MS);
    const weeklyOrders = await Order.countDocuments({
      buyerId: req.user.id,
      status: { $ne: 'cancelada' },
      createdAt: { $gte: weekAgo },
    });

    if (weeklyOrders >= 2) {
      return res.status(400).json({ message: 'Solo puedes crear 2 compras o reservas por semana.' });
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
    await expireOldReservations();

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
      .populate('history.changedBy', 'name email role')
      .sort({ createdAt: -1 })
      .lean();

    const enrichedOrders = await attachCardData(orders);

    return res.json({ orders: enrichedOrders });
  } catch (err) {
    console.error('Error en GET /api/orders:', err);
    return res.status(500).json({ message: 'Error al listar órdenes' });
  }
});

// Detalle de una orden
router.get('/:id', authRequired, async (req, res) => {
  try {
    await expireOldReservations();

    const order = await Order.findById(req.params.id)
      .populate('buyerId', 'name email role')
      .populate('sellerId', 'name email role')
      .populate('listingId')
      .populate('history.changedBy', 'name email role')
      .lean();

    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });

    const isBuyer = order.buyerId?._id?.toString() === req.user.id;
    const isSeller = order.sellerId?._id?.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ message: 'No tienes permiso para ver esta orden' });
    }

    const [orderWithCard] = await attachCardData([order]);

    return res.json({ order: orderWithCard });
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

    const sellerNotifyingPayment = isSeller && ['pagada', 'cancelada'].includes(status);
    if (sellerNotifyingPayment) {
      order.notifications.push({
        type: status,
        message: `La orden fue marcada como ${status} por el vendedor.`,
        recipient: 'buyer',
      });
    }

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
