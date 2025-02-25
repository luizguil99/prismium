import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { 
  ConnectPage, 
  ProjectList, 
  CreateProjectForm, 
  SupabaseLogo,
} from './modal-components';
import type { 
  SupabaseProject,
  SupabaseRegion,
  SupabaseOrganization,
  OAuthResponse
} from './modal-components';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// OAuth flow constants
const SUPABASE_CLIENT_ID = import.meta.env.VITE_SUPABASE_CLIENT_ID as string;
// Define redirect URL safely for SSR
const SUPABASE_REDIRECT_URI = import.meta.env.VITE_SUPABASE_REDIRECT_URI || "http://localhost:5173/oauth/supabase";
const OAUTH_STATE_KEY = 'supabase_oauth_state';
const OAUTH_CODE_VERIFIER_KEY = 'supabase_oauth_code_verifier';

// Check if we're in the browser
const isBrowser = typeof window !== 'undefined';

// Sample regions - in a real implementation, you would fetch these from Supabase API
const SAMPLE_REGIONS: SupabaseRegion[] = [
  { id: 'us-east-1', name: 'North America (N. Virginia)' },
  { id: 'us-west-1', name: 'North America (California)' },
  { id: 'eu-central-1', name: 'Europe (Frankfurt)' },
  { id: 'ap-southeast-2', name: 'Asia Pacific (Sydney)' },
];

// Pricing plans
const PRICING_PLANS = ['free', 'pro', 'team', 'enterprise'];

export function SupabaseConfigModal({ isOpen, onClose }: SupabaseConfigModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedProjects, setConnectedProjects] = useState<SupabaseProject[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [organizations, setOrganizations] = useState<SupabaseOrganization[]>([]);

  // Check if user is already connected to Supabase
  useEffect(() => {
    if (!isBrowser) return; // Execute only in browser
    
    const checkConnection = () => {
      const token = localStorage.getItem('supabase_access_token');
      if (token) {
        setIsConnected(true);
        // Here you can load user projects
        fetchProjects(token);
        // Fetch organizations
        fetchOrganizations(token);
      }
    };

    if (isOpen) {
      checkConnection();
    }
  }, [isOpen]);

  // Function to fetch user organizations
  const fetchOrganizations = async (token: string) => {
    try {
      console.log('🔍 Fetching Supabase organizations...');
      // Use our proxy endpoint
      const response = await fetch('/api/supabase-organizations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Supabase-Auth': token,
        },
      });
      
      if (response.ok) {
        const orgs = await response.json() as SupabaseOrganization[];
        console.log('✅ Organizations retrieved successfully:', orgs.length);
        setOrganizations(orgs);
      } else {
        console.error('❌ Failed to fetch organizations');
        toast.error('Error fetching Supabase organizations');
      }
    } catch (error) {
      console.error('❌ Error fetching organizations:', error);
      toast.error('Error communicating with server');
    }
  };

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

  // Function to handle project creation success
  const handleProjectCreated = () => {
    setShowCreateForm(false);
    const token = localStorage.getItem('supabase_access_token');
    if (token) {
      fetchProjects(token);
    }
  };

  // Function to disconnect from Supabase
  const disconnectSupabase = () => {
    if (!isBrowser) return; // Add protection against SSR
    
    localStorage.removeItem('supabase_access_token');
    localStorage.removeItem('supabase_refresh_token');
    setIsConnected(false);
    setConnectedProjects([]);
    setOrganizations([]);
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
            className="bg-bolt-elements-background-depth-2 rounded-lg p-6 w-[500px] border border-bolt-elements-borderColor shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
                <SupabaseLogo />
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
              showCreateForm ? (
                <CreateProjectForm 
                  regions={SAMPLE_REGIONS}
                  organizations={organizations}
                  onCancel={() => setShowCreateForm(false)}
                  onProjectCreated={handleProjectCreated}
                />
              ) : (
                <ProjectList 
                  projects={connectedProjects} 
                  onCreateProject={() => setShowCreateForm(true)}
                  onDisconnect={disconnectSupabase}
                />
              )
            ) : (
              <ConnectPage 
                isConnecting={isConnecting}
                onConnect={startOAuthFlow}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
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
