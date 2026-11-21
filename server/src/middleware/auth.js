const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'meru-jwt-secret-key-development-2026';

/**
 * Authentication middleware
 * Checks for token in HTTP-only cookie 'token' or Authorization header 'Bearer <token>'
 */
function requireAuth(req, res, next) {
  try {
    let token = null;

    // 1. Check HTTP-only cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Fallback to Authorization: Bearer <token>
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7).trim();
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid authentication session. Please log in.' });
  }
}

module.exports = {
  requireAuth,
  JWT_SECRET,
};
