const { client: redisClient } = require('../redisClient');

async function cacheCardsSearch(req, res, next) {
  try {
    const query = (req.query.q || '').trim();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 0, 0) || 20;

    if (!query) {
      return next();
    }

    const cacheKey = `cards:search:${query.toLowerCase()}:p${page}:l${limit}`;

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
