import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  console.error('Supabase configuration is missing. Please check your environment variables.');
}

// Create a Supabase client with the service role key (for server-side operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create a Supabase client with the anon key (for client-side operations)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Helper function to verify a JWT token
 * @param token The JWT token to verify
 * @returns The user data if token is valid, null otherwise
 */
export const verifyToken = async (token: string) => {
  try {
    console.log('[SUPABASE] Verifying token...');
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      console.error('[SUPABASE] Token verification error:', error.message);
      return null;
    }
    
    if (!data || !data.user) {
      console.error('[SUPABASE] No user data returned from token verification');
      return null;
    }
    
    console.log('[SUPABASE] Token successfully verified for user:', {
      id: data.user.id,
      email: data.user.email
    });
    
    return data.user;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SUPABASE] Exception during token verification:', errorMessage);
    return null;
  }
};