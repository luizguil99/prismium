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

const apiKeyMemoizeCache: { [k: string]: Record<string, string> } = {};

export function getApiKeysFromCookies() {
  const storedApiKeys = Cookies.get('apiKeys');
  let parsedKeys = {};

  if (storedApiKeys) {
    parsedKeys = apiKeyMemoizeCache[storedApiKeys];

    if (!parsedKeys) {
      parsedKeys = apiKeyMemoizeCache[storedApiKeys] = JSON.parse(storedApiKeys);
    }
  }

  return parsedKeys;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const APIKeyManager: React.FC<APIKeyManagerProps> = ({ provider, apiKey, setApiKey }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);

  const handleSave = () => {
    setApiKey(tempKey);
    setIsEditing(false);
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
