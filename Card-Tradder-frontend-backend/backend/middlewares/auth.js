const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'camilo7532';

// Verifica que haya token y que sea válido
function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;

  // Esperamos "Authorization: Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // payload = { id, role, iat, exp }
    req.user = payload;
    next();
  } catch (err) {
    console.error('Error verificando token:', err);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

// Verifica que el usuario tenga alguno de los roles permitidos
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No tienes permisos' });
    }
    next();
  };
}

module.exports = { authRequired, requireRole };
