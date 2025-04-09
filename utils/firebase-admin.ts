import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if Firebase Admin has already been initialized
if (!admin.apps.length) {
  try {
    const options: admin.AppOptions = {};
    
    // Check if service account key is available
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        // Initialize with service account file if it exists
        const serviceAccount = JSON.parse(
          Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString()
        );
        
        options.credential = admin.credential.cert(serviceAccount);
        console.log('Using Firebase service account from environment variable');
      } catch (e) {
        console.error('Error parsing Firebase service account JSON:', e);
      }
    } 
    // Check for individual credential components
    else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      options.credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'ats-checker-ba0fd',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
      console.log('Using Firebase service account from individual environment variables');
    }
    
    // Add database URL if available
    if (process.env.FIREBASE_DATABASE_URL) {
      options.databaseURL = process.env.FIREBASE_DATABASE_URL;
    }
    
    // Add storage bucket if available
    if (process.env.FIREBASE_STORAGE_BUCKET) {
      options.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    }
    
    // Initialize without credentials if none provided (will use Application Default Credentials)
    if (!options.credential) {
      console.log('No Firebase credentials found, using application default credentials');
    }
    
    // Always set projectId if available
    if (process.env.FIREBASE_PROJECT_ID) {
      options.projectId = process.env.FIREBASE_PROJECT_ID;
    }
    
    // Initialize Firebase Admin
    admin.initializeApp(options);
    console.log('Firebase Admin initialized successfully');
    
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

export { admin };