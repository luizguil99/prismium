import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { Button } from '../ui/button';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SupabaseProject {
  id: string;
  name: string;
  ref: string;
}

// OAuth flow constants
const SUPABASE_CLIENT_ID = import.meta.env.VITE_SUPABASE_CLIENT_ID as string;
// Define redirect URL safely for SSR
const SUPABASE_REDIRECT_URI = import.meta.env.VITE_SUPABASE_REDIRECT_URI || "http://localhost:5173/oauth/supabase";
const OAUTH_STATE_KEY = 'supabase_oauth_state';
const OAUTH_CODE_VERIFIER_KEY = 'supabase_oauth_code_verifier';

// Check if we're in the browser
const isBrowser = typeof window !== 'undefined';

export function SupabaseConfigModal({ isOpen, onClose }: SupabaseConfigModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedProjects, setConnectedProjects] = useState<SupabaseProject[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Check if user is already connected to Supabase
  useEffect(() => {
    if (!isBrowser) return; // Execute only in browser
    
    const checkConnection = () => {
      const token = localStorage.getItem('supabase_access_token');
      if (token) {
        setIsConnected(true);
        // Here you can load user projects
        fetchProjects(token);
      }
    };

    if (isOpen) {
      checkConnection();
    }
  }, [isOpen]);

  // Function to fetch user projects
  const fetchProjects = async (token: string) => {
    try {
      console.log('🔍 Fetching Supabase projects...');
      // Use our proxy endpoint instead of calling Supabase API directly
      const response = await fetch('/api/supabase-projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Supabase-Auth': token, // Pass token to our server
        },
      });
      
      if (response.ok) {
        const projects = await response.json() as SupabaseProject[];
        console.log('✅ Projects retrieved successfully:', projects.length);
        setConnectedProjects(projects);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch projects:', errorText);
        toast.error('Error fetching Supabase projects');
      }
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      toast.error('Error communicating with server');
    }
  };

  // Function to generate code verifier for PKCE
  const generateCodeVerifier = () => {
    if (!isBrowser) return ''; // Add protection against SSR
    
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
  };

  // Function to generate code challenge from code verifier
  const generateCodeChallenge = async (verifier: string) => {
    if (!isBrowser) return ''; // Add protection against SSR
    
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  // Start OAuth flow
  const startOAuthFlow = async () => {
    if (!isBrowser) return; // Add protection against SSR
    
    setIsConnecting(true);
    try {
      console.log('🚀 Starting Supabase OAuth flow...');
      
      // Generate random state for security
      const state = Math.random().toString(36).substring(2, 15);
      localStorage.setItem(OAUTH_STATE_KEY, state);
      console.log('🔐 State generated and stored:', state);
      
      // Generate code verifier for PKCE
      const codeVerifier = generateCodeVerifier();
      localStorage.setItem(OAUTH_CODE_VERIFIER_KEY, codeVerifier);
      console.log('🔑 Code verifier generated and stored (first 5 chars):', codeVerifier.substring(0, 5) + '...');
      
      // Generate code challenge
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      console.log('🧩 Code challenge generated (first 5 chars):', codeChallenge.substring(0, 5) + '...');
      
      // Build authorization URL
      const authUrl = new URL('https://api.supabase.com/v1/oauth/authorize');
      authUrl.searchParams.append('client_id', SUPABASE_CLIENT_ID);
      authUrl.searchParams.append('redirect_uri', SUPABASE_REDIRECT_URI);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('state', state);
      authUrl.searchParams.append('code_challenge', codeChallenge);
      authUrl.searchParams.append('code_challenge_method', 'S256');
      
      console.log('🔗 Authorization URL built:', authUrl.toString());
      console.log('🌐 Opening Supabase authorization page in new tab...');
      
      // Open Supabase authorization page in a new tab instead of redirecting
      window.open(authUrl.toString(), '_blank');
      
      // Set a small timeout before resetting isConnecting
      // This gives a better UX as the button doesn't flash back immediately
      setTimeout(() => {
        setIsConnecting(false);
      }, 1000);
    } catch (error) {
      console.error('❌ Error starting OAuth flow:', error);
      toast.error('Error connecting to Supabase');
      setIsConnecting(false);
    }
  };

  // Function to disconnect from Supabase
  const disconnectSupabase = () => {
    if (!isBrowser) return; // Add protection against SSR
    
    localStorage.removeItem('supabase_access_token');
    localStorage.removeItem('supabase_refresh_token');
    setIsConnected(false);
    setConnectedProjects([]);
    toast.success('Successfully disconnected from Supabase');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-bolt-elements-background-depth-2 rounded-lg p-6 w-[400px] border border-bolt-elements-borderColor shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 109 113" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#paint0_linear)"/>
                  <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#paint1_linear)" fillOpacity="0.2"/>
                  <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.04075L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#3ECF8E"/>
                  <defs>
                    <linearGradient id="paint0_linear" x1="53.9738" y1="54.974" x2="94.1635" y2="71.8295" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#249361"/>
                      <stop offset="1" stopColor="#3ECF8E"/>
                    </linearGradient>
                    <linearGradient id="paint1_linear" x1="36.1558" y1="30.578" x2="54.4844" y2="106.916" gradientUnits="userSpaceOnUse">
                      <stop/>
                      <stop offset="1" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                </svg>
                Supabase Integration
              </h2>
              <button
                onClick={onClose}
                className="text-red-500 hover:text-red-400 transition-colors"
              >
                <span className="i-ph-x-bold w-5 h-5" />
              </button>
            </div>

            {isConnected ? (
              <div className="space-y-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-md">
                  <p className="text-green-800 dark:text-green-400 font-medium">Connected to Supabase!</p>
                  <p className="text-sm text-green-700 dark:text-green-500 mt-1">
                    Your account is connected and you can manage your Supabase projects.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-bolt-elements-textPrimary">Your Projects</h3>
                  {connectedProjects.length > 0 ? (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {connectedProjects.map((project) => (
                        <div 
                          key={project.id} 
                          className="border border-bolt-elements-borderColor rounded-md p-3 hover:bg-bolt-elements-background-depth-1 transition-colors"
                        >
                          <h4 className="font-medium text-bolt-elements-textPrimary">{project.name}</h4>
                          <p className="text-sm text-bolt-elements-textSecondary">{project.ref}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-bolt-elements-textTertiary">No projects found</p>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={disconnectSupabase}
                    className={classNames(
                      'px-4 py-2 text-sm font-medium rounded-md',
                      'bg-red-500/10 text-red-500 hover:bg-red-500/20',
                      'transition-colors'
                    )}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-bolt-elements-textSecondary">
                  Connect to Supabase to manage your organizations and projects directly 
                  from our application. This will allow you to create and manage Supabase resources
                  for your applications.
                </p>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-bolt-elements-textPrimary">What you can do:</h3>
                  <ul className="list-disc list-inside text-sm text-bolt-elements-textSecondary space-y-1">
                    <li>Access and manage your existing projects</li>
                    <li>Create new projects</li>
                    <li>Configure authentication and databases</li>
                    <li>Manage access and permissions</li>
                  </ul>
                </div>

                <div className="flex justify-center pt-4">
                  <button
                    onClick={startOAuthFlow}
                    disabled={isConnecting}
                    className={classNames(
                      'px-4 py-2 text-sm font-medium rounded-md',
                      'bg-emerald-600 hover:bg-emerald-700 text-white',
                      'transition-colors flex items-center gap-2',
                      isConnecting ? 'opacity-70 cursor-not-allowed' : ''
                    )}
                  >
                    {isConnecting ? (
                      <>
                        <motion.span 
                          className="i-ph-spinner-bold w-4 h-4"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 109 113" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="white"/>
                          <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.04075L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="white"/>
                        </svg>
                        Connect to Supabase
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface OAuthResponse {
  access_token: string;
  refresh_token: string;
  [key: string]: any;
}

// Function to be called after OAuth redirect
export async function handleOAuthCallback(code: string, state: string) {
  if (!isBrowser) {
    throw new Error('handleOAuthCallback function can only be executed in browser');
  }

  // Verify state for security
  const savedState = localStorage.getItem(OAUTH_STATE_KEY);
  if (state !== savedState) {
    throw new Error('Invalid state');
  }

  // Retrieve code verifier
  const codeVerifier = localStorage.getItem(OAUTH_CODE_VERIFIER_KEY);
  if (!codeVerifier) {
    throw new Error('Code verifier not found');
  }

  console.log('🔄 Exchanging code for token through server...');
  
  try {
    // Call server endpoint to exchange code for token
    const response = await fetch('/api/supabase-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error in server response:', errorData);
      throw new Error(`Error getting token: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json() as OAuthResponse;
    console.log('✅ Tokens successfully obtained through server!');
    
    // Store tokens
    localStorage.setItem('supabase_access_token', data.access_token);
    localStorage.setItem('supabase_refresh_token', data.refresh_token);
    
    // Clear state and code verifier
    localStorage.removeItem(OAUTH_STATE_KEY);
    localStorage.removeItem(OAUTH_CODE_VERIFIER_KEY);

    return data;
  } catch (error) {
    console.error('❌ Error exchanging code for token:', error);
    throw error;
  }
}
