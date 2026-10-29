const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.SESSION_SECRET || 'smart_mess_default_secure_secret_key_change_in_prod';

/**
 * Authentication Middleware for Manager
 * Checks HTTP-only cookie first, falls back to Authorization Bearer header
 */
async function authenticateManager(req, res, next) {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in as mess manager.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid token. Please log in again.',
      });
    }

    const user = await User.findById(decoded.userId).populate('messId');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Manager account not found or deactivated.',
      });
    }

    if (user.role !== 'manager' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager privilege required.',
      });
    }

    req.user = user;
    req.messId = user.messId?._id || user.messId;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

module.exports = {
  authenticateManager,
  JWT_SECRET,
};
