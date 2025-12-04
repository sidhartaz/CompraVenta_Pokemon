// scripts/seed_20000_listings_real_users.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

const User = require('../models/User');
const Listing = require('../models/Listing');
const Card = require('../models/Card');

// Usa la misma URI que tu app
const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cardtrader';

// Config
const TOTAL_FAKE_SELLERS_IF_EMPTY = 200;   // solo si no hay vendedores reales
const TOTAL_LISTINGS = 20000;              // publicaciones a generar

async function ensureSellers(passwordHash) {
  console.log('🔎 Buscando vendedores existentes (role: "vendedor")...');
  let sellers = await User.find({ role: 'vendedor' });

  if (sellers.length > 0) {
    console.log(`✅ Vendedores existentes encontrados: ${sellers.length}`);
    return sellers;
  }

  console.log('⚠️ No hay vendedores existentes. Creando vendedores falsos...');

  const vendedoresDocs = [];
  for (let i = 0; i < TOTAL_FAKE_SELLERS_IF_EMPTY; i++) {
    vendedoresDocs.push({
      name: faker.person.fullName(),
      email: `vendedor_auto${i}@fake.com`,
      password: passwordHash,
      role: 'vendedor',
      contactWhatsapp: faker.phone.number('+56 9 ########'),
      isActive: true,
    });
  }

  const inserted = await User.insertMany(vendedoresDocs);
  console.log(`✅ Vendedores falsos creados: ${inserted.length}`);
  return inserted;
}

async function main() {
  await mongoose.connect(MONGO);
  console.log('✅ Conectado a MongoDB:', MONGO);

  // ❗ Si quieres limpiar SOLO listings, puedes descomentar esto:
  // console.log('🧹 Borrando listings existentes...');
  // await Listing.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1) Asegurar vendedores (usar reales si existen)
  const sellers = await ensureSellers(passwordHash);
  const sellerIds = sellers.map(s => s._id);

  // 2) Obtener algunas cartas si existen en la colección Card
  const cards = await Card.find().limit(500);
  const cardIds = cards.map(c => c.id);
  console.log(`🃏 Cartas encontradas en colección Card: ${cardIds.length}`);

  const condiciones = ['nuevo', 'como nuevo', 'bueno', 'jugado', 'para repuesto'];

  // 3) Generar 20.000 listings
  const listings = [];
  for (let i = 0; i < TOTAL_LISTINGS; i++) {
    const sellerId = faker.helpers.arrayElement(sellerIds);

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
    const slug = `${slugBase}-${i}-${Date.now()}`;

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
  console.error('❌ Error en seed_20000_listings_real_users:', err);
  process.exit(1);
});
//node scripts/seed_20000_listings_real_users.js//ejecutar//Password123!