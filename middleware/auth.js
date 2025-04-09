const admin = require('firebase-admin');
const User = require('../models/User');

/**
 * Middleware to authenticate requests using Firebase Auth
 * Sets req.user with the authenticated user's information
 */
const authenticate = async (req, res, next) => {
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header or invalid format');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (!decodedToken) {
      console.log('Invalid token');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get the user's UID from the decoded token
    const uid = decodedToken.uid;
    
    console.log(`Auth middleware: Looking for user with UID ${uid}`);
    
    // Find the user in our database
    let user = await User.findOne({ uid });
    
    // If user doesn't exist in our database, create a new one with basic info
    if (!user) {
      console.log(`User with UID ${uid} not found in database, creating new user record`);
      
      const email = decodedToken.email || '';
      const name = decodedToken.name || email.split('@')[0] || '';
      
      user = new User({
        uid,
        email,
        name,
        role: 'user', // Default role
      });
      
      await user.save();
      console.log(`Created new user: ${email}`);
    } else {
      console.log(`Found existing user: ${user.email} with role: ${user.role}`);
    }
    
    // Set the user information on the request object
    req.user = {
      uid: user.uid,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

/**
 * Middleware to check if the user is an admin
 * Must be used after the authenticate middleware
 */
const requireAdmin = (req, res, next) => {
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.user.role !== 'admin') {
    console.log(`Access denied: User ${req.user.email} is not an admin (role: ${req.user.role})`);
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  
  next();
};

/**
 * Middleware to check if the user is a recruiter or admin
 * Must be used after the authenticate middleware
 */
const requireRecruiter = (req, res, next) => {
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
    console.log(`Access denied: User ${req.user.email} is not a recruiter or admin (role: ${req.user.role})`);
    return res.status(403).json({ error: 'Access denied. Recruiter privileges required.' });
  }
  
  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireRecruiter
}; 