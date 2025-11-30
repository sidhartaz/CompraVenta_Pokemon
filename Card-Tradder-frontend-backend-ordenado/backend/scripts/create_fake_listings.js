// scripts/create_fake_listings.js
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');  // ← CORRECTO
const Card = require('../models/Card');
const Seller = require('../models/Seller');
const Listing = require('../models/Listing');

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cardtrader';

async function main() {
  await mongoose.connect(MONGO);
  console.log('Conectado a MongoDB');

  // Crear vendedores falsos
  const sellers = [];
  for (let i = 0; i < 50; i++) {
    sellers.push({
      name: faker.person.fullName(),
      avatar: faker.image.avatar(),  // genera una imagen de perfil aleatoria
      rating: (Math.random() * 2 + 3).toFixed(2)
    });
  }

  const createdSellers = await Seller.insertMany(sellers);
  console.log('Vendedores creados:', createdSellers.length);

  // Obtener cartas
  const cards = await Card.find({}).limit(500).lean();

  const listings = [];

  for (const card of cards) {
    const count = Math.floor(Math.random() * 3); // 0 a 2 listings por carta

    for (let i = 0; i < count; i++) {
      const seller = createdSellers[Math.floor(Math.random() * createdSellers.length)];

      listings.push({
        cardId: card.id,
        sellerId: seller._id,
        price: faker.commerce.price({ min: 1000, max: 200000 }),
        condition: faker.helpers.arrayElement([
          'Near Mint',
          'Light Played',
          'Moderately Played',
          'Heavily Played',
        ]),
        images: [card.images?.large || '']
      });
    }
  }

  await Listing.insertMany(listings);
  console.log('Listings creados:', listings.length);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
