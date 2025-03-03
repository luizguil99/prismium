import React, { useState } from 'react';
import type { ProviderInfo } from '~/types/model';
import { Input } from '@/components/ui/ui/input';
import { Label } from '@/components/ui/ui/label';
import { Button } from '@/components/ui/ui/button';
import { Check, X, Key } from 'lucide-react';
import Cookies from 'js-cookie';

interface APIKeyManagerProps {
  provider: ProviderInfo;
  apiKey: string;
  setApiKey: (key: string) => void;
  getApiKeyLink?: string;
  labelForGetApiKey?: string;
}

// Sistema de memória em tempo de execução para armazenar as API keys
// Isto mantém as chaves apenas na memória durante a sessão do navegador
// e não as armazena em nenhum lugar persistente como localStorage ou cookies
class SecureMemoryStorage {
  private static instance: SecureMemoryStorage;
  private storage: Record<string, string> = {};
  private static ENV_PREFIX = "ENV_";
  
  private constructor() {}
  
  static getInstance(): SecureMemoryStorage {
    if (!SecureMemoryStorage.instance) {
      SecureMemoryStorage.instance = new SecureMemoryStorage();
    }
    return SecureMemoryStorage.instance;
  }
  
  // Salva uma chave na memória
  set(key: string, value: string): void {
    this.storage[key] = value;
  }
  
  // Obtém uma chave da memória
  get(key: string): string | undefined {
    return this.storage[key];
  }
  
  // Salva as chaves de API de forma segura apenas na memória
  saveApiKeys(apiKeys: Record<string, string>): void {
    Object.entries(apiKeys).forEach(([provider, key]) => {
      this.set(provider, key);
    });
    
    // Remover cookies antigos para garantir que não há exposição
    Cookies.remove('apiKeys');
    Object.keys(apiKeys).forEach(provider => {
      Cookies.remove(`${provider}_API_KEY`);
    });
    
    // Limpar localStorage também
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('prismium_api_keys');
    }
  }
  
  // Obtém todas as chaves de API da memória
  getAllApiKeys(): Record<string, string> {
    const result: Record<string, string> = {};
    
    // Filtrar apenas as chaves que são de providers (não começam com o prefixo especial)
    Object.entries(this.storage).forEach(([key, value]) => {
      if (!key.startsWith(SecureMemoryStorage.ENV_PREFIX)) {
        result[key] = value;
      }
    });
    
    return result;
  }
  
  // Salva uma variável de ambiente na memória
  setEnvVar(name: string, value: string): void {
    this.set(`${SecureMemoryStorage.ENV_PREFIX}${name}`, value);
  }
  
  // Obtém uma variável de ambiente da memória
  getEnvVar(name: string): string | undefined {
    return this.get(`${SecureMemoryStorage.ENV_PREFIX}${name}`);
  }
  
  // Limpa todas as chaves da memória
  clear(): void {
    this.storage = {};
  }
}

// Função para obter as chaves da API da memória segura
export function getApiKeysFromCookies(): Record<string, string> {
  try {
    if (typeof window === 'undefined') return {};
    
    // Obtém as chaves da memória segura
    return SecureMemoryStorage.getInstance().getAllApiKeys();
  } catch (error) {
    console.error('Error loading API keys:', error);
    return {};
  }
}

// Função para salvar as chaves da API na memória segura
export function saveApiKeysToCookies(apiKeys: Record<string, string>): void {
  try {
    if (typeof window === 'undefined') return;
    
    // Salva as chaves na memória segura
    SecureMemoryStorage.getInstance().saveApiKeys(apiKeys);
  } catch (error) {
    console.error('Error saving API keys:', error);
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const APIKeyManager: React.FC<APIKeyManagerProps> = ({ provider, apiKey, setApiKey }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);

  const handleSave = () => {
    setApiKey(tempKey);
    setIsEditing(false);
    
    // Atualizar as chaves na memória segura
    const apiKeys = getApiKeysFromCookies();
    const updatedKeys = {
      ...apiKeys,
      [provider.name]: tempKey
    };
    saveApiKeysToCookies(updatedKeys);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-zinc-300">
          {provider?.name} API Key
        </Label>
      </div>

      {!isEditing ? (
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">
            {apiKey ? '••••••••' : 'Não configurado (funcionará se definido no arquivo .env)'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="bg-black hover:bg-zinc-900 text-zinc-100 border-zinc-800"
          >
            <Key className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            type="password"
            value={tempKey}
            placeholder="Digite sua API Key"
            onChange={(e) => setTempKey(e.target.value)}
            className="flex-1 bg-black border-zinc-800 text-zinc-100 focus:ring-zinc-700"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleSave}
            className="bg-black hover:bg-zinc-900 text-emerald-500 hover:text-emerald-400 border-zinc-800"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setTempKey(apiKey);
              setIsEditing(false);
            }}
            className="bg-black hover:bg-zinc-900 text-red-500 hover:text-red-400 border-zinc-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {provider?.getApiKeyLink && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(provider?.getApiKeyLink)}
          className="bg-black hover:bg-zinc-900 text-zinc-100 border-zinc-800"
        >
          <Key className="h-4 w-4 mr-2" />
          {provider?.labelForGetApiKey || 'Obter API Key'}
        </Button>
      )}
    </div>
  );
};
