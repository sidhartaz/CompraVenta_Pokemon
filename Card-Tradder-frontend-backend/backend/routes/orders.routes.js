const express = require('express');
const { authRequired } = require('../middlewares/auth');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const { expireOldReservations, DAY_IN_MS } = require('../utils/reservations');
const Card = require('../models/Card');
const User = require('../models/User');

const router = express.Router();
const DEFAULT_RESERVATION_HOURS = 24;

async function markListingReservation(listingId, { reservedBy = null, reservedUntil = null, isActive = true }) {
  await Listing.findByIdAndUpdate(listingId, {
    $set: {
      isActive,
      reservedBy,
      reservedUntil,
    },
  });
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

    if (!listing.isActive) {
      return res.status(400).json({ message: 'La publicación no está disponible para nuevas órdenes o reservas.' });
    }

    const weekAgo = new Date(Date.now() - 7 * DAY_IN_MS);
    const weeklyOrders = await Order.countDocuments({
      buyerId: req.user.id,
      status: { $ne: 'cancelada' },
      createdAt: { $gte: weekAgo },
    });

    if (weeklyOrders >= 7) {
      return res.status(400).json({ message: 'Solo puedes crear 7 compras o reservas por semana.' });
    }

    const normalizedType = type === 'reserva' ? 'reserva' : 'compra';

    if (normalizedType === 'reserva' && req.user.role !== 'cliente') {
      return res.status(403).json({ message: 'Solo los clientes pueden crear reservas.' });
    }

    if (normalizedType === 'reserva') {
      const existingReservation = await Order.findOne({
        listingId,
        type: 'reserva',
        status: { $in: ['reservada', 'pendiente', 'pagada'] },
      });

      if (existingReservation) {
        return res.status(400).json({ message: 'Esta publicación ya cuenta con una reserva activa.' });
      }
    }
    const initialStatus = normalizedType === 'reserva' ? 'reservada' : 'pendiente';

    const buyer = await User.findById(req.user.id).select('name');
    const notifications = [];
    const reservationExpiresAt =
      normalizedType === 'reserva'
        ? new Date(Date.now() + DEFAULT_RESERVATION_HOURS * 60 * 60 * 1000)
        : null;

    if (normalizedType === 'reserva') {
      notifications.push({
        type: 'info',
        message: `${buyer?.name || 'El cliente'} ha creado una reserva para tu publicación "${listing.name}"`,
        recipient: 'seller',
      });
    }

    const order = await Order.create({
      listingId,
      cardId: listing.cardId || null,
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
      notifications,
      reservationExpiresAt,
    });

    if (normalizedType === 'reserva') {
      await markListingReservation(listingId, {
        reservedBy: req.user.id,
        reservedUntil: reservationExpiresAt,
        isActive: false,
      });
    }

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
    await expireOldReservations(Order, Listing);

    const filter = {};
    const { status, type } = req.query;
    if (status) filter.status = status;

    if (type) {
      const allowedTypes = ['compra', 'reserva'];
      if (!allowedTypes.includes(type)) {
        return res.status(400).json({ message: 'Tipo de orden inválido' });
      }
      filter.type = type;
    }

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
    await expireOldReservations(Order, Listing);

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

    const wasReservation = order.type === 'reserva';

    order.status = status;
    order.history.push({
      status,
      note: note || `Estado actualizado a ${status}`,
      changedBy: req.user.id,
    });

    if (wasReservation && status === 'reservada' && !order.reservationExpiresAt) {
      order.reservationExpiresAt = new Date(Date.now() + DEFAULT_RESERVATION_HOURS * 60 * 60 * 1000);
    }

    const sellerNotifyingPayment = isSeller && ['pagada', 'cancelada'].includes(status);
    if (sellerNotifyingPayment) {
      order.notifications.push({
        type: status,
        message: `La orden fue marcada como ${status} por el vendedor.`,
        recipient: 'buyer',
      });
    }

    await order.save();

    if (wasReservation) {
      if (status === 'cancelada') {
        await markListingReservation(order.listingId, {
          reservedBy: null,
          reservedUntil: null,
          isActive: true,
        });
      } else if (status === 'pagada') {
        await markListingReservation(order.listingId, {
          reservedBy: null,
          reservedUntil: null,
          isActive: false,
        });
      } else if (status === 'reservada') {
        await markListingReservation(order.listingId, {
          reservedBy: order.buyerId,
          reservedUntil: order.reservationExpiresAt,
          isActive: false,
        });
      }
    }

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
