import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'gymfit-pro-secret-key-2026';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Login required' });
  }
  try {
    const decoded = verifyToken(header.slice(7));
    req.ownerId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired, please login again' });
  }
}
