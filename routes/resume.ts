import express from 'express';
import { 
  checkDuplicateResume, 
  saveResume, 
  getUserResumes, 
  getResumeById, 
  deleteResume, 
  getAllResumes
} from '../controllers/resumeController';
import { authenticate, isAdmin } from '../middlewares/authMiddleware';
import cors from 'cors';
import { corsOptions } from '../config/cors';

const router = express.Router();

// Apply CORS to all resume routes
router.use(cors(corsOptions));

// Handle OPTIONS requests explicitly for all routes
router.options('*', cors(corsOptions));

// Add explicit preflight handling for high-traffic routes
router.options('/admin/all', cors(corsOptions));
router.options('/check-duplicate', cors(corsOptions));

// Apply authentication middleware to all routes
router.use(authenticate);

// Admin routes (must come before routes with params)
router.get('/admin/all', isAdmin, getAllResumes);

// Resume routes with query parameters (must come before routes with :id)
router.get('/', getUserResumes);

// Standard resume routes
router.post('/check-duplicate', checkDuplicateResume);
router.post('/', saveResume);
router.get('/:id', getResumeById);
router.delete('/:id', deleteResume);

export default router;