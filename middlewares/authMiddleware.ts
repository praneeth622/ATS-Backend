import { Request, Response, NextFunction } from 'express';
import { admin } from '../utils/firebase-admin';
import User from '../models/User';

// Extend Request to include user data
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role?: string;
    [key: string]: any;
  };
}

// Middleware to authenticate users with Firebase
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check if the authorization header exists
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    
    // Extract the token
    const idToken = authHeader.split('Bearer ')[1];
    
    try {
      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // Check if user exists in database
      let user = await User.findOne({ uid: decodedToken.uid });
      
      // If user doesn't exist, create new user record
      if (!user) {
        try {
          user = await User.create({
            uid: decodedToken.uid,
            email: decodedToken.email || '',
            name: decodedToken.name || '',
            role: 'user', // Default role
            created_at: new Date(),
            updated_at: new Date()
          });
          console.log('Created new user record:', user);
        } catch (createError) {
          console.error('Error creating user record:', createError);
          // Continue even if user creation fails
        }
      }
      
      // Add the verified user to the request
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        role: user?.role || 'user',
        name: user?.name || decodedToken.name || ''
      };
      
      return next();
    } catch (tokenError: unknown) {
      const errorMessage = tokenError instanceof Error ? tokenError.message : 'Unknown error';
      console.error('[AUTH] Token verification failed:', errorMessage);
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    console.error('[AUTH] Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Middleware to check if user has admin role
export const isAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    console.log('--- isAdmin middleware check starting ---');
    console.log('User from request:', req.user);
    
    if (!req.user) {
      console.log('Admin check failed: No user in request');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get the user's role from the database to ensure it's up to date
    const user = await User.findOne({ uid: req.user.uid });
    console.log('Admin check for user ID:', req.user.uid);
    
    if (!user) {
      console.log('Admin check failed: User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('User found in database:', {
      uid: user.uid,
      email: user.email,
      role: user.role
    });
    
    if (user.role !== 'admin') {
      console.log('Admin check failed: User role is not admin, got:', user.role);
      return res.status(403).json({ error: 'Not authorized: Admin access required' });
    }
    
    // Update the req.user with the latest role information
    req.user.role = user.role;
    console.log('Admin check successful, proceeding with request');
    
    next();
  } catch (error) {
    console.error('Error in isAdmin middleware:', error);
    res.status(500).json({ error: 'Error checking admin status' });
  }
};