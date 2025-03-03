import React, { useState, useEffect, useCallback } from 'react';
import type { ProviderInfo } from '~/types/model';
import { Input } from '@/components/ui/ui/input';
import { Label } from '@/components/ui/ui/label';
import { Button } from '@/components/ui/ui/button';
import { Check, X, Key, ExternalLink, Shield, User } from 'lucide-react';
import Cookies from 'js-cookie';
import { SecureMemoryStorage } from './SecureMemoryStorage';

interface APIKeyManagerProps {
  provider: ProviderInfo;
  apiKey: string;
  setApiKey: (key: string) => void;
  getApiKeyLink?: string;
  labelForGetApiKey?: string;
}

// Chave usada para armazenar as API keys do usuário no localStorage
const USER_API_KEYS_STORAGE_KEY = 'prismium_user_api_keys';

// Cache para otimizar o acesso às chaves API armazenadas
const apiKeyMemoizeCache: { [k: string]: Record<string, string> } = {};

// Cache para verificar se uma chave de API está definida no ambiente
const providerEnvKeyStatusCache: Record<string, boolean> = {};

/**
 * Obtém as chaves API do usuário armazenadas no localStorage
 */
export function getUserApiKeysFromStorage(): Record<string, string> {
  try {
    if (typeof window === 'undefined') return {};
    
    const storedKeys = localStorage.getItem(USER_API_KEYS_STORAGE_KEY);
    if (!storedKeys) return {};
    
    // Verifica se já existe no cache
    if (apiKeyMemoizeCache[storedKeys]) {
      return apiKeyMemoizeCache[storedKeys];
    }
    
    // Caso contrário, analisa e armazena no cache
    const parsedKeys = JSON.parse(storedKeys) as Record<string, string>;
    apiKeyMemoizeCache[storedKeys] = parsedKeys;
    return parsedKeys;
  } catch (error) {
    console.error('Erro ao carregar chaves API do usuário do localStorage:', error);
    return {};
  }
}

/**
 * Salva as chaves API do usuário no localStorage
 */
export function saveUserApiKeysToStorage(apiKeys: Record<string, string>): void {
  try {
    if (typeof window === 'undefined') return;
    
    // Remover chaves vazias
    const filteredKeys = Object.fromEntries(
      Object.entries(apiKeys).filter(([_, value]) => value && value.trim() !== '')
    );
    
    // Salvar no localStorage
    localStorage.setItem(USER_API_KEYS_STORAGE_KEY, JSON.stringify(filteredKeys));
    
    // Salvar também como cookie para acesso do lado do servidor
    // Garantir que o valor seja salvo como JSON sem aspas extras
    const jsonValue = JSON.stringify(filteredKeys);
    Cookies.set('prismium_user_api_keys', jsonValue, { 
      expires: 365,
      path: '/',
      sameSite: 'Lax'
    });
    
    // Atualizar o cache
    apiKeyMemoizeCache[JSON.stringify(filteredKeys)] = filteredKeys;
    
    console.log('Chaves API do usuário salvas com sucesso no localStorage');
  } catch (error) {
    console.error('Erro ao salvar chaves API do usuário no localStorage:', error);
  }
}

/**
 * Obtém as chaves da API da memória segura
 * Mantém a compatibilidade com o sistema existente
 */
export function getApiKeysFromCookies(): Record<string, string> {
  try {
    if (typeof window === 'undefined') return {};
    
    // Combinar chaves da memória segura com chaves do usuário
    const memoryKeys = SecureMemoryStorage.getInstance().getAllApiKeys();
    const userKeys = getUserApiKeysFromStorage();
    
    // Prioridade para as chaves do usuário (substituem as da memória)
    return { ...memoryKeys, ...userKeys };
  } catch (error) {
    console.error('Erro ao carregar chaves API:', error);
    return {};
  }
}

/**
 * Salva as chaves da API na memória segura
 * Mantém a compatibilidade com o sistema existente
 */
export function saveApiKeysToCookies(apiKeys: Record<string, string>): void {
  try {
    if (typeof window === 'undefined') return;
    
    // Salvar na memória segura (chaves do sistema/ambiente)
    SecureMemoryStorage.getInstance().saveApiKeys(apiKeys);
    
    // As chaves do usuário são salvas separadamente via saveUserApiKeysToStorage
  } catch (error) {
    console.error('Erro ao salvar chaves API:', error);
  }
}

// Componente Badge personalizado
const Badge = ({ variant, children }: { variant: 'green' | 'blue' | 'red' | 'gray'; children: React.ReactNode }) => {
  const variantClasses = {
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
    gray: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

// Componente Switch personalizado
const KeySwitch = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? 'bg-blue-500' : 'bg-zinc-700'
      }`}
      onClick={() => onChange(!checked)}
    >
      <span
        className={`${
          checked ? 'translate-x-6' : 'translate-x-1'
        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
      />
    </button>
  );
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const APIKeyManager: React.FC<APIKeyManagerProps> = (props) => {
  const { provider, apiKey, setApiKey, getApiKeyLink, labelForGetApiKey } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [tempKey, setTempKey] = useState('');  // Iniciar com string vazia para não expor a chave do sistema
  const [isEnvKeySet, setIsEnvKeySet] = useState(false);
  const [keySource, setKeySource] = useState<'system' | 'user' | 'none'>('none');
  const [useUserKey, setUseUserKey] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  
  // Verificar se há uma chave API definida no ambiente
  const checkEnvApiKey = useCallback(async () => {
    // Verificar o cache primeiro
    if (providerEnvKeyStatusCache[provider.name] !== undefined) {
      setIsEnvKeySet(providerEnvKeyStatusCache[provider.name]);
      return;
    }

    try {
      const response = await fetch(`/api/check-env-key?provider=${encodeURIComponent(provider.name)}`);
      if (response.ok) {
        const data = await response.json() as { isSet: boolean };
        const isSet = data.isSet;
        
        // Armazenar no cache
        providerEnvKeyStatusCache[provider.name] = isSet;
        setIsEnvKeySet(isSet);
      } else {
        setIsEnvKeySet(false);
      }
    } catch (error) {
      console.error('Falha ao verificar chave de API no ambiente:', error);
      setIsEnvKeySet(false);
    }
  }, [provider.name]);
  
  // Determinar a fonte da chave API atual
  const determineKeySource = useCallback(() => {
    const userKeys = getUserApiKeysFromStorage();
    const userKey = userKeys[provider.name];
    const memoryStorage = SecureMemoryStorage.getInstance();
    const systemKeyExists = !!memoryStorage.get(provider.name) || isEnvKeySet;
    
    if (userKey) {
      setKeySource('user');
      setUseUserKey(true);
      // Se for uma chave do usuário, podemos mostrar para edição
      setTempKey(userKey);
      setApiKey(userKey);
      return;
    }
    
    if (systemKeyExists) {
      setKeySource('system');
      setUseUserKey(false);
      // NÃO carregar a chave do sistema no tempKey para evitar expor
      setTempKey('');
      const systemKey = memoryStorage.get(provider.name);
      if (systemKey) {
        setApiKey(systemKey);
      }
      return;
    }
    
    setKeySource('none');
    setTempKey('');
    setShowConfig(true); // Mostrar configuração se não houver chave
  }, [provider.name, isEnvKeySet, setApiKey]);

  // Atualizar os estados ao mudar de provedor
  useEffect(() => {
    // Verificar se existe uma chave no ambiente
    checkEnvApiKey();
    
    // Determinar a fonte da chave atual
    determineKeySource();
    
    // Resetar modo de edição
    setIsEditing(false);
  }, [provider.name, checkEnvApiKey, determineKeySource]);

  // Efeito para determinar se deve mostrar a configuração
  useEffect(() => {
    // Mostrar configuração se não houver chave ou se o usuário estiver usando sua própria chave
    if (keySource === 'none') {
      setShowConfig(true);
    }
  }, [keySource]);

  const handleSave = () => {
    if (tempKey.trim()) {
      // Atualizar o estado local
      setApiKey(tempKey);
      
      // Salvar no localStorage como chave do usuário
      const userKeys = getUserApiKeysFromStorage();
      const newUserKeys = { ...userKeys, [provider.name]: tempKey };
      saveUserApiKeysToStorage(newUserKeys);
      
      setKeySource('user');
      setUseUserKey(true);
      setShowConfig(false); // Esconder configuração após salvar
    } else {
      // Se a chave foi apagada, remover do localStorage
      const userKeys = getUserApiKeysFromStorage();
      const { [provider.name]: removedKey, ...restKeys } = userKeys;
      saveUserApiKeysToStorage(restKeys);
      
      // Restaurar para chave do sistema se disponível
      if (isEnvKeySet) {
        const systemKey = SecureMemoryStorage.getInstance().get(provider.name);
        if (systemKey) {
          setApiKey(systemKey);
        }
        setKeySource('system');
        setUseUserKey(false);
        setShowConfig(false); // Esconder configuração se voltou para chave do sistema
      } else {
        setApiKey('');
        setKeySource('none');
        setShowConfig(true); // Manter configuração visível se não há chave
      }
    }
    
    setIsEditing(false);
  };

  const handleUseSystemKey = () => {
    // Remover a chave do usuário
    const userKeys = getUserApiKeysFromStorage();
    const { [provider.name]: removedKey, ...restKeys } = userKeys;
    saveUserApiKeysToStorage(restKeys);
    
    // Restaurar para chave do sistema sem expor o valor
    const systemKey = SecureMemoryStorage.getInstance().get(provider.name);
    if (systemKey) {
      setApiKey(systemKey);
    }
    // IMPORTANTE: Não exibir a chave do sistema
    setTempKey('');
    setKeySource('system');
    setUseUserKey(false);
    setIsEditing(false);
    setShowConfig(false);
  };

  const handleToggleKeySource = (useUser: boolean) => {
    if (useUser) {
      setUseUserKey(true);
      setIsEditing(true);
      // Iniciar com campo vazio quando alternar para chave pessoal
      setTempKey('');
      setShowConfig(true);
    } else {
      handleUseSystemKey();
    }
  };

  // Se não precisamos mostrar a configuração, retornar componente compacto
  if (!showConfig && keySource !== 'none') {
    return (
      <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer" onClick={() => setShowConfig(true)}>
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-zinc-400" />
          <span className="text-sm text-zinc-300">{provider.name} API Key</span>
        </div>
        <Badge variant={keySource === 'system' ? 'blue' : 'green'}>
          {keySource === 'system' ? 'System' : 'Personal'}
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <Label className="text-sm font-medium text-zinc-300">
            {provider?.name} API Key Configuration
          </Label>
          {keySource !== 'none' && (
            <span className="text-xs text-zinc-500 mt-1">
              {keySource === 'system' ? 'Using system key' : 'Using your personal key'}
            </span>
          )}
        </div>
        
        {keySource !== 'none' && (
          <div className="flex items-center gap-2">
            {isEnvKeySet && (
              <>
                <span className="text-xs text-zinc-400">System</span>
                <KeySwitch checked={useUserKey} onChange={handleToggleKeySource} />
                <span className="text-xs text-zinc-400">Personal</span>
              </>
            )}
          </div>
        )}
      </div>

      {keySource !== 'none' && !isEditing ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {keySource === 'system' ? (
              <>
                <Shield className="h-4 w-4 text-blue-500" />
                <Badge variant="blue">System Key</Badge>
              </>
            ) : (
              <>
                <User className="h-4 w-4 text-green-500" />
                <Badge variant="green">Personal Key</Badge>
              </>
            )}
            <span className="text-sm text-zinc-400 ml-2">
              ••••••••••••••••••••••••••
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Se for chave do sistema, limpar o tempKey para não mostrar a chave
              if (keySource === 'system') {
                setTempKey('');
              } else {
                // Se for chave do usuário, carregar para edição
                const userKeys = getUserApiKeysFromStorage();
                setTempKey(userKeys[provider.name] || '');
              }
              setIsEditing(true);
            }}
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border-zinc-700"
          >
            <Key className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            type="password"
            value={tempKey}
            placeholder={keySource === 'system' ? 'Enter your new personal API key' : `Enter your ${provider.name} API Key`}
            onChange={(e) => setTempKey(e.target.value)}
            className="w-full bg-zinc-900 border-zinc-700 text-zinc-100 focus:ring-zinc-600"
          />
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              className="bg-zinc-900 hover:bg-zinc-800 text-emerald-500 hover:text-emerald-400 border-zinc-700"
            >
              <Check className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                // Não restaurar a chave do sistema para o tempKey para evitar exposição
                if (keySource === 'user') {
                  const userKeys = getUserApiKeysFromStorage();
                  setTempKey(userKeys[provider.name] || '');
                } else {
                  setTempKey('');
                }
                if (keySource === 'none') {
                  setShowConfig(false);
                }
              }}
              className="bg-zinc-900 hover:bg-zinc-800 text-red-500 hover:text-red-400 border-zinc-700"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {(getApiKeyLink || provider?.getApiKeyLink) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(getApiKeyLink || provider?.getApiKeyLink)}
          className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border-zinc-700"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          {labelForGetApiKey || provider?.labelForGetApiKey || 'Get API Key'}
        </Button>
      )}
    </div>
  );
};
