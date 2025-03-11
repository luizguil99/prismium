import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

const DEBUG = false; // Controls debug logging

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration not found. Make sure SUPABASE_URL and SUPABASE_ANON_KEY variables are defined in .env');
  throw new Error('Supabase configuration not found');
}

// Supabase client singleton
let supabaseClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

// Function to get or create the Supabase client
export const getOrCreateClient = () => {
  if (!supabaseClient) {
    // Conditional log only in debug mode
    if (DEBUG) console.log('🔧 Creating new Supabase client...');
    
    try {
      supabaseClient = createSupabaseBrowserClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          auth: {
            persistSession: true, // Keep session between page loads
            autoRefreshToken: true, // Automatically refresh authentication token
            detectSessionInUrl: false, // Don't detect session in URL
            flowType: 'pkce', // Use PKCE for better security
            debug: DEBUG, // Debug logging only if DEBUG is active
            // Cookie works automatically with default option
          },
          // Settings to reduce network requests
          global: {
            headers: {
              // Appropriate cache headers to reduce duplicate calls
              'Cache-Control': 'no-cache'
            }
          },
          // Settings to reduce realtime events
          realtime: {
            params: {
              eventsPerSecond: 1 // Limit realtime events
            }
          }
        }
      );
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      throw error;
    }
  }
  return supabaseClient;
};

// Function specific for browser client
export const createBrowserClient = () => {
  if (DEBUG) console.log('🌐 Creating Supabase client for browser...');
  return createSupabaseBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce'
      }
    }
  );
};
