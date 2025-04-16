import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { verifyToken, supabaseAdmin } from '../utils/supabase';

// Extend Request to include user data
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role?: string;
    [key: string]: any;
  };
}

// Middleware to authenticate users with Supabase
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    console.log('[AUTH] Starting authentication process');
    
    // Check if the authorization header exists
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[AUTH] No authorization header or invalid format');
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    
    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    console.log('[AUTH] Token extracted from header');
    
    try {
      // Verify the JWT token using Supabase
      const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !supabaseUser) {
        console.error('[AUTH] Token verification failed:', error?.message || 'No user found');
        return res.status(401).json({ error: 'Unauthorized - Invalid token' });
      }
      
      console.log('[AUTH] Supabase user verified:', { 
        id: supabaseUser.id, 
        email: supabaseUser.email,
        metadata: supabaseUser.user_metadata 
      });
      
      // Check if user exists in database by uid
      let user = await User.findOne({ uid: supabaseUser.id });
      
      // If not found by UID, try to find by email as fallback
      if (!user && supabaseUser.email) {
        console.log(`[AUTH] User not found by UID, trying to find by email: ${supabaseUser.email}`);
        user = await User.findOne({ email: supabaseUser.email });
        
        // If found by email, update the uid to match Supabase
        if (user) {
          console.log(`[AUTH] User found by email. Updating uid from ${user.uid} to ${supabaseUser.id}`);
          user.uid = supabaseUser.id;
          await user.save();
        }
      }
      
      // If user still doesn't exist, create new user record
      if (!user) {
        console.log('[AUTH] User not found in database, creating new user record');
        try {
          user = await User.create({
            uid: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
            role: 'user', // Default role
            created_at: new Date(),
            updated_at: new Date()
          });
          console.log('[AUTH] Created new user record:', { uid: user.uid, email: user.email });
        } catch (createError) {
          console.error('[AUTH] Error creating user record:', createError);
          // Try one more time with a fallback approach
          try {
            // Check if there's a conflict - might be a duplicate key error
            const existingUserCheck = await User.findOne({ 
              $or: [
                { uid: supabaseUser.id },
                { email: supabaseUser.email }
              ]
            });
            
            if (existingUserCheck) {
              console.log('[AUTH] Found existing user after creation error:', existingUserCheck);
              user = existingUserCheck;
            }
          } catch (fallbackError) {
            console.error('[AUTH] Final fallback check failed:', fallbackError);
          }
        }
      }
      
      if (!user) {
        console.error('[AUTH] Failed to create or find user in database');
        return res.status(500).json({ error: 'Failed to create or find user record' });
      }
      
      // Attach user to request
      req.user = {
        uid: user.uid,
        email: user.email,
        role: user.role,
        ...user.toObject()
      };
      
      console.log('[AUTH] Authentication successful for user:', { uid: req.user.uid, email: req.user.email });
      next();
    } catch (error) {
      console.error('[AUTH] Error during token verification:', error);
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    console.error('[AUTH] Unexpected error during authentication:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
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