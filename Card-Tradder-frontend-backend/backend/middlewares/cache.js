const { client: redisClient } = require('../redisClient');

async function cacheCardsSearch(req, res, next) {
  try {
    const query = req.query.q || '';

    if (!query) {
      return next();
    }

    const cacheKey = `cards:search:${query.toLowerCase()}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    res.locals.cacheKey = cacheKey;
    next();
  } catch (err) {
    console.error('Error en cacheCardsSearch:', err.message);
    next();
  }
}

module.exports = { cacheCardsSearch };
