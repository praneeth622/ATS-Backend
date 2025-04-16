import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from '../routes/auth';
import resumeRoutes from '../routes/resume';
import jobRoutes from '../routes/job';
import vendorRoutes from '../routes/vendor';
import { corsOptions } from '../config/cors';
import { createServer } from 'http';
import * as net from 'net';

// Load environment variables
dotenv.config();

// MongoDB Connection Setup
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test'; // Default to local MongoDB

if (!MONGODB_URI) {
  console.error('No MongoDB URI provided');
  process.exit(1);
}

// Express app setup
const app = express();
let PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;

// Function to check if a port is in use
const isPortInUse = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => {
        // Port is in use
        resolve(true);
      })
      .once('listening', () => {
        // Port is free
        server.close();
        resolve(false);
      })
      .listen(port, '0.0.0.0');
  });
};

// Function to find an available port
const findAvailablePort = async (startPort: number, maxAttempts: number = 10): Promise<number> => {
  let port = startPort;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const inUse = await isPortInUse(port);
    if (!inUse) {
      return port;
    }
    port++;
    attempts++;
  }
  
  throw new Error(`Could not find an available port after ${maxAttempts} attempts`);
};

// Enable CORS - must be before other middleware
app.use(cors(corsOptions));

// Add CORS headers to all responses
app.use((req, res, next) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    return res.status(204).end();
  }
  
  // For non-OPTIONS requests
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  next();
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// JSON body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root endpoint - health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

app.get('/', (req, res) => {
  res.send('Backend is live');
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/vendors', vendorRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize MongoDB connection and start server
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Run database initialization checks
    try {
      const { initializeDatabase } = await import('../utils/db-init');
      await initializeDatabase();
      
      // Check if the configured port is available, if not find an available one
      try {
        const inUse = await isPortInUse(PORT);
        if (inUse) {
          console.warn(`Port ${PORT} is already in use.`);
          PORT = await findAvailablePort(PORT + 1);
          console.log(`Using alternative port: ${PORT}`);
        }
        
        // Create HTTP server
        const server = createServer(app);
        
        // Start the server with the available port
        server.listen(PORT, '0.0.0.0', () => {
          console.log(`Server running at http://localhost:${PORT}`);
        });
        
        // Handle graceful shutdown
        const shutdown = () => {
          console.log('Shutting down server...');
          server.close(() => {
            console.log('Server closed');
            // Close mongoose connection without callback (updated for newer Mongoose versions)
            mongoose.connection.close()
              .then(() => {
                console.log('MongoDB connection closed');
                process.exit(0);
              })
              .catch(err => {
                console.error('Error closing MongoDB connection:', err);
                process.exit(1);
              });
          });
        };
        
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
        
      } catch (portError) {
        console.error('Failed to start server:', portError);
        mongoose.connection.close();
        process.exit(1);
      }
      
    } catch (initError) {
      console.error('Error during database initialization:', initError);
      process.exit(1);
    }
  })
  .catch((err: Error) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

export default app;
