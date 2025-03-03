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

const STORAGE_KEY = 'prismium_api_keys';
const SECRET_KEY = 'prismium-secure';

// Implementação simples de mascaramento das chaves de API
function simpleEncrypt(text: string): string {
  if (!text) return '';
  
  // Converter o texto para bytes e fazer um XOR com a chave
  const result = [];
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
    result.push(String.fromCharCode(charCode));
  }
  
  // Converter para base64 para garantir texto seguro para armazenamento
  return btoa(result.join(''));
}

function simpleDecrypt(encrypted: string): string {
  if (!encrypted) return '';
  try {
    // Decodificar o base64
    const decoded = atob(encrypted);
    
    // Reverter o XOR
    const result = [];
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
      result.push(String.fromCharCode(charCode));
    }
    
    return result.join('');
  } catch (error) {
    console.error('Error decrypting:', error);
    return '';
  }
}

export function getApiKeysFromCookies(): Record<string, string> {
  try {
    if (typeof window === 'undefined') return {};
    
    const encryptedData = localStorage.getItem(STORAGE_KEY);
    if (!encryptedData) return {};
    
    try {
      // Tenta decodificar os dados como JSON encriptado
      const decryptedData = simpleDecrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch (e) {
      // Fallback: tenta interpretar como JSON não encriptado
      try {
        const data = JSON.parse(encryptedData);
        // Salva de volta no formato encriptado
        saveApiKeysToCookies(data);
        return data;
      } catch {
        console.error('Could not parse API keys');
        return {};
      }
    }
  } catch (error) {
    console.error('Error loading API keys:', error);
    return {};
  }
}

export function saveApiKeysToCookies(apiKeys: Record<string, string>): void {
  try {
    if (typeof window === 'undefined') return;
    
    // Encripta o JSON das chaves
    const encryptedData = simpleEncrypt(JSON.stringify(apiKeys));
    localStorage.setItem(STORAGE_KEY, encryptedData);
    
    // Remover cookies antigos
    Cookies.remove('apiKeys');
    Object.keys(apiKeys).forEach(provider => {
      Cookies.remove(`${provider}_API_KEY`);
    });
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
    
    // Atualizar as chaves no localStorage de forma criptografada
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
