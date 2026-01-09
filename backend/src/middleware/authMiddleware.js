const authMiddleware = (req, res, next) => {
  // Check if the server has successfully populated req.session.user after a valid cookie was sent
  if (req.session && req.session.user) {
    req.user = req.session.user; // Attach user to the request object
    return next(); // User is authenticated, proceed.
  } else {
    // If no valid session exists, reject the request
    res.status(401).json({ message: 'Not authenticated' });
  }
};

const admin = (req, res, next) => {
  // Check for a valid session and if the user has 'admin' or 'superadmin' role
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    return next(); // User is an admin or superadmin, proceed.
  } else {
    // If user is not an admin, reject the request
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

const superadmin = (req, res, next) => {
  // Check for a valid session and if the user has the 'superadmin' role
  if (req.user && req.user.role === 'superadmin') {
    return next(); // User is a superadmin, proceed.
  } else {
    // If user is not a superadmin, reject the request
    res.status(403).json({ message: 'Not authorized as a superadmin' });
  }
};

module.exports = { authMiddleware, admin, superadmin };
