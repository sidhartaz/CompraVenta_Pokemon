// scripts/seed_20000_listings.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

const User = require('../models/User');
const Listing = require('../models/Listing');
const Card = require('../models/Card');

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cardtrader';

// Cantidades
const TOTAL_SELLERS = 200;      // vendedores falsos
const TOTAL_CLIENTES = 500;     // clientes falsos
const TOTAL_LISTINGS = 20000;   // publicaciones para pruebas

async function main() {
  await mongoose.connect(MONGO);
  console.log('✅ Conectado a MongoDB:', MONGO);

  // ⚠️ Si quieres limpiar antes, descomenta:
  // await Listing.deleteMany({});
  // await User.deleteMany({ role: { $in: ['cliente', 'vendedor'] } });

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1) Crear vendedores
  const vendedoresDocs = [];
  for (let i = 0; i < TOTAL_SELLERS; i++) {
    vendedoresDocs.push({
      name: faker.person.fullName(),
      email: `vendedor${i}@fake.com`,
      password: passwordHash,
      role: 'vendedor',
      contactWhatsapp: faker.phone.number('+56 9 ########'),
      isActive: true,
    });
  }

  // 2) Crear clientes
  const clientesDocs = [];
  for (let i = 0; i < TOTAL_CLIENTES; i++) {
    clientesDocs.push({
      name: faker.person.fullName(),
      email: `cliente${i}@fake.com`,
      password: passwordHash,
      role: 'cliente',
      contactWhatsapp: faker.phone.number('+56 9 ########'),
      isActive: true,
    });
  }

  console.log('👤 Insertando usuarios falsos (vendedores + clientes)...');
  const usuarios = await User.insertMany([...vendedoresDocs, ...clientesDocs]);
  const vendedoresIds = usuarios.filter(u => u.role === 'vendedor').map(u => u._id);
  console.log(`   → ${vendedoresIds.length} vendedores creados.`);
  console.log(`   → ${usuarios.length - vendedoresIds.length} clientes creados.`);

  // 3) Obtener algunas cartas (si ya tienes cards cargadas)
  const cards = await Card.find().limit(500);
  const cardIds = cards.map(c => c.id);
  console.log(`🃏 Cartas encontradas en colección Card: ${cardIds.length}`);

  const condiciones = ['nuevo', 'como nuevo', 'bueno', 'jugado', 'para repuesto'];

  // 4) Crear 20.000 listings
  const listings = [];
  for (let i = 0; i < TOTAL_LISTINGS; i++) {
    const sellerId = faker.helpers.arrayElement(vendedoresIds);

    let cardId = undefined;
    let baseName = '';

    if (cardIds.length > 0) {
      cardId = faker.helpers.arrayElement(cardIds);
      baseName = `Carta Pokémon ${cardId}`;
    } else {
      baseName = faker.commerce.productName();
    }

    const name = `${baseName} #${i}`;
    const slugBase = faker.helpers.slugify(name.toLowerCase());
    const slug = `${slugBase}-${i}-${Date.now()}`; // para asegurar unicidad

    listings.push({
      sellerId,
      cardId,
      name,
      slug,
      price: faker.number.int({ min: 500, max: 200000 }),
      condition: faker.helpers.arrayElement(condiciones),
      description: faker.lorem.sentence({ min: 5, max: 20 }),
      imageData: null,
      status: 'aprobada',
      isActive: true,
      createdAt: faker.date.past({ years: 1 }),
    });

    // Solo para mostrar progreso en consola
    if ((i + 1) % 5000 === 0) {
      console.log(`   → ${i + 1} listings generados...`);
    }
  }

  console.log('📦 Insertando listings en MongoDB...');
  await Listing.insertMany(listings);
  console.log(`✅ Listo: ${listings.length} listings creados.`);

  await mongoose.disconnect();
  console.log('🔌 Desconectado de MongoDB');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error en seed_20000_listings:', err);
  process.exit(1);
});
//node scripts/seed_20000_listings.js//ejecutar//Password123!
//