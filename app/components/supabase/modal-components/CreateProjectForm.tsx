import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { ErrorMessage, ProjectLimitErrorMessage } from './ErrorMessage';

interface SupabaseRegion {
  id: string;
  name: string;
}

interface SupabaseOrganization {
  id: string;
  name: string;
}

interface CreateProjectFormProps {
  regions: SupabaseRegion[];
  organizations: SupabaseOrganization[];
  onCancel: () => void;
  onProjectCreated: () => void;
}

// Pricing plans
const PRICING_PLANS = ['free', 'pro', 'team', 'enterprise'];

export function CreateProjectForm({ 
  regions, 
  organizations, 
  onCancel, 
  onProjectCreated 
}: CreateProjectFormProps) {
  const [projectName, setProjectName] = useState('');
  const [projectRegion, setProjectRegion] = useState(regions.length > 0 ? regions[0].id : 'us-east-1');
  const [projectPlan, setProjectPlan] = useState('free');
  const [dbPassword, setDbPassword] = useState('');
  const [generatePassword, setGeneratePassword] = useState(true);
  const [organizationId, setOrganizationId] = useState(organizations.length > 0 ? organizations[0].id : '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasProjectLimitError, setHasProjectLimitError] = useState(false);

  // Generate a secure password for database
  const generateSecurePassword = () => {
    if (typeof window === 'undefined') return '';
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    const passwordLength = 16;
    let password = '';
    const array = new Uint8Array(passwordLength);
    window.crypto.getRandomValues(array);
    
    for (let i = 0; i < passwordLength; i++) {
      password += chars.charAt(array[i] % chars.length);
    }
    
    return password;
  };

  const createProject = async () => {
    if (!projectName.trim()) {
      toast.error('Project name is required');
      return;
    }
    
    if (!organizationId) {
      toast.error('Please select an organization');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setHasProjectLimitError(false);
    
    try {
      // Use generated password or user input
      const password = generatePassword 
        ? generateSecurePassword() 
        : dbPassword;
      
      if (!generatePassword && !dbPassword) {
        toast.error('Please enter a database password or choose to generate one');
        setIsLoading(false);
        return;
      }
      
      console.log('🔨 Creating new Supabase project...');
      
      const token = localStorage.getItem('supabase_access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Call our proxy endpoint to create a project
      const response = await fetch('/api/supabase-create-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Supabase-Auth': token,
        },
        body: JSON.stringify({
          name: projectName,
          organization_id: organizationId,
          region: projectRegion,
          plan: projectPlan,
          db_pass: password,
        }),
      });
      
      if (response.ok) {
        const project = await response.json();
        console.log('✅ Project created successfully:', project);
        toast.success('Supabase project created successfully!');
        
        // Reset form
        setProjectName('');
        setDbPassword('');
        onProjectCreated();
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to create project:', errorText);
        
        try {
          // Tenta analisar o erro como JSON
          const errorData = JSON.parse(errorText);
          
          // Verifica se é o erro específico de limite de projetos
          if (errorData.message && errorData.message.includes('maximum limits for the number of active free projects')) {
            setHasProjectLimitError(true);
          } else {
            setError(errorData.message || 'Error creating Supabase project');
          }
        } catch (e) {
          // Se não for JSON, apenas define a mensagem de erro
          setError('Error creating Supabase project');
        }
      }
    } catch (error) {
      console.error('❌ Error creating project:', error);
      setError('Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-bolt-elements-textPrimary">Create New Project</h3>
      
      {hasProjectLimitError && <ProjectLimitErrorMessage />}
      
      {error && !hasProjectLimitError && <ErrorMessage message={error} />}
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className={classNames(
              'w-full px-3 py-2 rounded-md text-sm',
              'bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor',
              'text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500',
              'transition-all'
            )}
            placeholder="My Awesome Project"
          />
        </div>
        
        {organizations.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
              Organization
            </label>
            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className={classNames(
                'w-full px-3 py-2 rounded-md text-sm',
                'bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor',
                'text-bolt-elements-textPrimary',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500',
                'transition-all'
              )}
            >
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
            Region
          </label>
          <select
            value={projectRegion}
            onChange={(e) => setProjectRegion(e.target.value)}
            className={classNames(
              'w-full px-3 py-2 rounded-md text-sm',
              'bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor',
              'text-bolt-elements-textPrimary',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500',
              'transition-all'
            )}
          >
            {regions.map(region => (
              <option key={region.id} value={region.id}>{region.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
            Plan
          </label>
          <select
            value={projectPlan}
            onChange={(e) => setProjectPlan(e.target.value)}
            className={classNames(
              'w-full px-3 py-2 rounded-md text-sm',
              'bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor',
              'text-bolt-elements-textPrimary',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500',
              'transition-all'
            )}
          >
            {PRICING_PLANS.map(plan => (
              <option key={plan} value={plan}>
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              id="generate-password"
              type="checkbox"
              checked={generatePassword}
              onChange={(e) => setGeneratePassword(e.target.checked)}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 rounded"
            />
            <label htmlFor="generate-password" className="ml-2 block text-sm text-bolt-elements-textSecondary">
              Generate secure database password
            </label>
          </div>
          
          {!generatePassword && (
            <div>
              <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
                Database Password
              </label>
              <input
                type="password"
                value={dbPassword}
                onChange={(e) => setDbPassword(e.target.value)}
                className={classNames(
                  'w-full px-3 py-2 rounded-md text-sm',
                  'bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor',
                  'text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500',
                  'transition-all'
                )}
                placeholder="Strong password for database"
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          onClick={onCancel}
          className={classNames(
            'px-4 py-2 text-sm font-medium rounded-md',
            'bg-transparent text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
            'transition-colors'
          )}
        >
          Cancel
        </button>
        <button
          onClick={createProject}
          disabled={isLoading}
          className={classNames(
            'px-4 py-2 text-sm font-medium rounded-md',
            'bg-emerald-600 hover:bg-emerald-700 text-white',
            'transition-colors flex items-center gap-2',
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          )}
        >
          {isLoading ? (
            <>
              <motion.span 
                className="i-ph-spinner-bold w-4 h-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              Creating...
            </>
          ) : 'Create Project'}
        </button>
      </div>
    </div>
  );
} 