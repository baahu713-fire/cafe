const adminMiddleware = (req, res, next) => {
    // This middleware should run after authMiddleware, which attaches the user to the request
    if (req.user && req.user.role === 'admin') {
      return next(); // User is an admin, proceed
    }
    res.status(403).json({ message: 'Forbidden: Access is restricted to administrators.' });
  };
  
  module.exports = adminMiddleware;
  