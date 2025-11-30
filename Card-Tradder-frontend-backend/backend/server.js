const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

const { authRequired, requireRole } = require('./middlewares/auth');
const { client: redisClient, connectRedis } = require('./redisClient');

// Cargar variables de entorno
dotenv.config();

// Inicializar app
const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. MIDDLEWARES ---
app.use(express.json());                          // Para JSON (Postman, fetch, etc.)
app.use(express.urlencoded({ extended: true }));  // Por si envías formularios
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

// --- 2. IMPORTAR MODELOS ---
const User = require('./models/User');
const Card = require('./models/Card');
const Listing = require('./models/Listing');
const Seller = require('./models/Seller');

// --- 3. CONEXIÓN A BASE DE DATOS ---
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cardtrader';

mongoose
  .connect(mongoUri)
  .then(() => console.log('✅ Base de Datos MongoDB conectada'))
  .catch((err) => {
    console.error('❌ ERROR DE CONEXIÓN A MONGO DB:');
    console.error('   Verifica que MongoDB esté corriendo y que la variable MONGO_URI en tu archivo .env sea correcta.');
    console.error('   Detalle:', err.message);
    process.exit(1);
  });

// Conectar a Redis (no detiene la app si falla)
connectRedis().catch((err) => {
  console.error('No se pudo conectar a Redis:', err.message);
});

// --- 4. RUTAS DE AUTENTICACIÓN ---

// Registro
app.post('/api/register', async (req, res) => {
  console.log('📩 Registro:', req.body.email);
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'El correo ya existe' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const validRoles = ['cliente', 'vendedor'];
    const finalRole = validRoles.includes(role) ? role : 'cliente';

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: finalRole,
    });

    await newUser.save();

    console.log('✅ Usuario creado:', email);
    return res.status(201).json({
      message: 'Usuario registrado con éxito.',
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Error registro:', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
});

// Login con JWT
app.post('/api/login', async (req, res) => {
  console.log('🔑 Login body recibido:', req.body);

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Faltan email o contraseña' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'camilo7532';

    // Creamos el token con id y role
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error login:', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
});

// --- 5. ENDPOINTS PROTEGIDOS DE EJEMPLO (para probar JWT + ROLES) ---

// Cualquier usuario autenticado (cliente o vendedor)
app.get('/api/me', authRequired, (req, res) => {
  res.json({
    message: 'Usuario autenticado',
    user: req.user, // { id, role, iat, exp }
  });
});

// Solo vendedores (rol "vendedor") pueden acceder
app.get('/api/admin/ventas', authRequired, requireRole('vendedor'), (req, res) => {
  res.json({
    message: 'Solo vendedores pueden ver esta información',
  });
});

// --- 6. MIDDLEWARE DE CACHE PARA /api/cards/search ---

async function cacheCardsSearch(req, res, next) {
  try {
    const query = req.query.q || '';

    if (!query) {
      return next(); // sin query, nada que cachear
    }

    const cacheKey = `cards:search:${query.toLowerCase()}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    // Guardamos la key para después
    res.locals.cacheKey = cacheKey;
    next();
  } catch (err) {
    console.error('Error en cacheCardsSearch:', err.message);
    next(); // si Redis falla, seguimos normal
  }
}

// --- 7. RUTAS DE CARTAS ---

// Buscar cartas por nombre (para el catálogo / buscador) con cache
app.get('/api/cards/search', cacheCardsSearch, async (req, res) => {
  try {
    const query = req.query.q || '';

    if (!query) {
      return res.json({ results: [] });
    }

    // Buscar cartas cuyo nombre contenga el texto (insensible a mayúsculas)
    const cards = await Card.find({
      name: { $regex: query, $options: 'i' },
    })
      .limit(20)
      .lean();

    if (!cards.length) {
      return res.json({ results: [] });
    }

    const results = [];

    for (const card of cards) {
      const listings = await Listing.find({ cardId: card.id })
        .populate('sellerId')
        .lean();

      const formattedListings = listings.map((lst) => ({
        price: lst.price,
        condition: lst.condition,
        seller: lst.sellerId,
      }));

      results.push({
        card,
        listings: formattedListings,
      });
    }

    const responseBody = { results };

    // Guardar en cache para próximas llamadas
    if (res.locals.cacheKey) {
      try {
        await redisClient.set(
          res.locals.cacheKey,
          JSON.stringify(responseBody),
          { EX: 60 } // 60 segundos
        );
      } catch (err) {
        console.error('Error guardando en Redis:', err.message);
      }
      res.setHeader('X-Cache', 'MISS');
    }

    return res.json(responseBody);
  } catch (error) {
    console.error('Error en /api/cards/search:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Autocomplete (para sugerencias de nombres desde el frontend)
app.get('/api/cards/autocomplete', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q) return res.json([]);

    const items = await Card.find({
      name: new RegExp('^' + q, 'i'),
    })
      .limit(8)
      .select('id name images')
      .lean();

    return res.json(items);
  } catch (error) {
    console.error('Error en /api/cards/autocomplete:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Detalle de una carta por id TCG (ej: base1-58, xy7-54, etc.)
app.get('/api/cards/:id', async (req, res) => {
  try {
    const cardId = req.params.id;

    const card = await Card.findOne({ id: cardId }).lean();
    if (!card) {
      return res.json({ card: null, listings: [] });
    }

    const listings = await Listing.find({ cardId })
      .populate('sellerId')
      .lean();

    const formattedListings = listings.map((lst) => ({
      price: lst.price,
      condition: lst.condition,
      seller: lst.sellerId,
    }));

    return res.json({
      card,
      listings: formattedListings,
    });
  } catch (error) {
    console.error('Error en /api/cards/:id:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- 8. RUTA FALLBACK (para que cualquier ruta del frontend cargue index.html) ---
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'index.html'));
});

// --- 9. INICIAR SERVIDOR ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
