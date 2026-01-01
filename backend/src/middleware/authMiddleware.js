const authMiddleware = (req, res, next) => {
  // Check if the server has successfully populated req.session.user after a valid cookie was sent
  if (req.session && req.session.user) {
    return next(); // User is authenticated, proceed.
  } else {
    // If no valid session exists, reject the request
    res.status(401).json({ message: 'Not authenticated' });
  }
};

const admin = (req, res, next) => {
  // Check for a valid session and if the user has the 'admin' role
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next(); // User is an admin, proceed.
  } else {
    // If user is not an admin, reject the request
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { authMiddleware, admin };
