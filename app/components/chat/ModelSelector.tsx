import type { ProviderInfo } from '~/types/model';
import { useEffect } from 'react';
import type { ModelInfo } from '~/lib/modules/llm/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/ui/select';
import { Label } from '@/components/ui/ui/label';

interface ModelSelectorProps {
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  modelList: ModelInfo[];
  providerList: ProviderInfo[];
  apiKeys: Record<string, string>;
  modelLoading?: string;
}

export const ModelSelector = ({
  model,
  setModel,
  provider,
  setProvider,
  modelList,
  providerList,
  modelLoading,
}: ModelSelectorProps) => {
  // Load enabled providers from cookies

  // Update enabled providers when cookies change
  useEffect(() => {
    // If current provider is disabled, switch to first enabled provider
    if (providerList.length == 0) {
      return;
    }

    if (provider && !providerList.map((p) => p.name).includes(provider.name)) {
      const firstEnabledProvider = providerList[0];
      setProvider?.(firstEnabledProvider);

      // Also update the model to the first available one for the new provider
      const firstModel = modelList.find((m) => m.provider === firstEnabledProvider.name);

      if (firstModel) {
        setModel?.(firstModel.name);
      }
    }
  }, [providerList, provider, setProvider, modelList, setModel]);

  if (providerList.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-[#0F1116] border border-[#2A2F3A]/50">
        <p className="text-center text-gray-400">
          Nenhum provedor está habilitado. Por favor, habilite pelo menos um provedor nas configurações para começar a usar o chat.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-zinc-300">Provedor</Label>
        <Select
          value={provider?.name ?? ''}
          onValueChange={(value) => {
            const newProvider = providerList.find((p) => p.name === value);
            if (newProvider && setProvider) {
              setProvider(newProvider);
              const firstModel = modelList.find((m) => m.provider === value);
              if (firstModel && setModel) {
                setModel(firstModel.name);
              }
            }
          }}
        >
          <SelectTrigger className="w-full bg-black border-zinc-800 text-zinc-100 hover:bg-zinc-900 focus:ring-zinc-700">
            <SelectValue placeholder="Selecione um provedor" />
          </SelectTrigger>
          <SelectContent className="bg-black border-zinc-800">
            {providerList.map((p) => (
              <SelectItem 
                key={p.name} 
                value={p.name} 
                className="text-zinc-100 hover:bg-zinc-900 focus:bg-zinc-900 focus:text-zinc-100"
              >
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-zinc-300">Modelo</Label>
        <Select
          key={provider?.name}
          value={model}
          onValueChange={setModel}
          disabled={modelLoading === 'all' || modelLoading === provider?.name}
        >
          <SelectTrigger className="w-full bg-black border-zinc-800 text-zinc-100 hover:bg-zinc-900 focus:ring-zinc-700">
            <SelectValue 
              placeholder={
                modelLoading === 'all' || modelLoading === provider?.name
                  ? 'Carregando...'
                  : 'Selecione um modelo'
              }
            />
          </SelectTrigger>
          <SelectContent className="bg-black border-zinc-800">
            {modelLoading === 'all' || modelLoading === provider?.name ? (
              <SelectItem value="_loading" className="text-zinc-100">
                Carregando...
              </SelectItem>
            ) : (
              modelList
                .filter((e) => e.provider === provider?.name && e.name)
                .map((modelOption) => (
                  <SelectItem 
                    key={modelOption.name} 
                    value={modelOption.name}
                    className="text-zinc-100 hover:bg-zinc-900 focus:bg-zinc-900 focus:text-zinc-100"
                  >
                    {modelOption.label || modelOption.name}
                  </SelectItem>
                ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
