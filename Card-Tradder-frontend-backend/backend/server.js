const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const adminRoutes = require('./routes/admin.routes');
const orderRoutes = require('./routes/orders.routes');
const authRoutes = require('./routes/auth.routes');
const listingRoutes = require('./routes/listings.routes');
const cardRoutes = require('./routes/cards.routes');
const { connectRedis } = require('./redisClient');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cardtrader';

const mongoConnection = mongoose
  .connect(mongoUri)
  .then(() => console.log('✅ Base de Datos MongoDB conectada'))
  .catch((err) => {
    console.error('❌ ERROR DE CONEXIÓN A MONGO DB:');
    console.error('   Verifica que MongoDB esté corriendo y que la variable MONGO_URI en tu archivo .env sea correcta.');
    console.error('   Detalle:', err.message);
    process.exit(1);
  });

connectRedis().catch((err) => {
  console.error('No se pudo conectar a Redis:', err.message);
});

app.use('/api', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);

app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'index.html'));
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = { app, mongoConnection };
