import express from 'express';
import { 
  getCurrentUser, 
  updateUser, 
  getAllUsers, 
  updateUserRole,
  createUserFromAuth,
  makeAdmin
} from '../controllers/authController';
import { authenticate, isAdmin } from '../middlewares/authMiddleware';
import cors from 'cors';
import { corsOptions } from '../config/cors';

const router = express.Router();

// Apply CORS to all auth routes
router.use(cors(corsOptions));

// Handle OPTIONS requests explicitly for all routes in this router
router.options('*', cors(corsOptions));

// Add explicit preflight handling for high-traffic routes
router.options('/create-from-auth', cors(corsOptions));
router.options('/me', cors(corsOptions));
router.options('/make-admin', cors(corsOptions));

// Public routes
router.post('/create-from-auth', createUserFromAuth);

// User routes
router.get('/me', authenticate, getCurrentUser);
router.put('/me', authenticate, updateUser);

// Admin routes
router.get('/users', authenticate, isAdmin, getAllUsers);
router.put('/users/role', authenticate, isAdmin, updateUserRole);

// Endpoint to make a user an admin without requiring authentication
// Typically this would be restricted, but we're providing it for initial setup
router.post('/make-admin', makeAdmin);

export default router;
