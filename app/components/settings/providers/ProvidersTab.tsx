import React, { useEffect, useState } from 'react';
import { Switch } from '~/components/ui/Switch';
import { useSettings } from '~/lib/hooks/useSettings';
import { LOCAL_PROVIDERS, URL_CONFIGURABLE_PROVIDERS } from '~/lib/stores/settings';
import type { IProviderConfig } from '~/types/model';
import { logStore } from '~/lib/stores/logs';

// Import a default fallback icon
import { providerBaseUrlEnvKeys } from '~/utils/constants';
import { LLMManager } from '~/lib/modules/llm/manager';

const DefaultIcon = '/icons/Default.svg'; // Adjust the path as necessary

export default function ProvidersTab() {
  const { providers, updateProviderSettings, isLocalModel } = useSettings();
  const [filteredProviders, setFilteredProviders] = useState<IProviderConfig[]>([]);
  const [disabledProviders, setDisabledProviders] = useState<string[]>([]);

  // Load base URLs from cookies
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Obter provedores desabilitados via LLMManager
    const llmManager = LLMManager.getInstance(import.meta.env);
    setDisabledProviders(llmManager.getDisabledProviders());

    // Auto-desabilitar provedores que foram desabilitados via .env
    Object.entries(providers).forEach(([key, value]) => {
      const isDisabledByEnv = llmManager.isProviderDisabled(key);
      if (isDisabledByEnv && value.settings.enabled) {
        console.log(`[Provider] ${key} foi desabilitado via .env`);
        logStore.logProvider(`Provider ${key} disabled by .env`, { provider: key });
        updateProviderSettings(key, { ...value.settings, enabled: false });
      }
    });

    let newFilteredProviders: IProviderConfig[] = Object.entries(providers).map(([key, value]) => ({
      ...value,
      name: key,
    }));

    if (searchTerm && searchTerm.length > 0) {
      newFilteredProviders = newFilteredProviders.filter((provider) =>
        provider.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (!isLocalModel) {
      newFilteredProviders = newFilteredProviders.filter((provider) => !LOCAL_PROVIDERS.includes(provider.name));
    }

    newFilteredProviders.sort((a, b) => a.name.localeCompare(b.name));

    // Split providers into regular and URL-configurable
    const regular = newFilteredProviders.filter((p) => !URL_CONFIGURABLE_PROVIDERS.includes(p.name));
    const urlConfigurable = newFilteredProviders.filter((p) => URL_CONFIGURABLE_PROVIDERS.includes(p.name));

    setFilteredProviders([...regular, ...urlConfigurable]);
  }, [providers, searchTerm, isLocalModel, updateProviderSettings]);

  const renderProviderCard = (provider: IProviderConfig) => {
    const envBaseUrlKey = providerBaseUrlEnvKeys[provider.name].baseUrlKey;
    const envBaseUrl = envBaseUrlKey ? import.meta.env[envBaseUrlKey] : undefined;
    const isUrlConfigurable = URL_CONFIGURABLE_PROVIDERS.includes(provider.name);
    const isDisabledByEnv = disabledProviders.includes(provider.name);

    return (
      <div
        key={provider.name}
        className="flex flex-col provider-item hover:bg-bolt-elements-bg-depth-3 p-4 rounded-lg border border-bolt-elements-borderColor"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <img
              src={`/icons/${provider.name}.svg`}
              onError={(e) => {
                e.currentTarget.src = DefaultIcon;
              }}
              alt={`${provider.name} icon`}
              className="w-6 h-6 dark:invert"
            />
            <span className="text-bolt-elements-textPrimary">{provider.name}</span>
            {isDisabledByEnv && (
              <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                Disabled in .env
              </span>
            )}
          </div>
          <Switch
            className="ml-auto"
            checked={provider.settings.enabled && !isDisabledByEnv}
            onCheckedChange={(enabled) => {
              if (isDisabledByEnv) return;
              
              updateProviderSettings(provider.name, { ...provider.settings, enabled });

              if (enabled) {
                console.log(`[Provider] ${provider.name} foi habilitado`);
                logStore.logProvider(`Provider ${provider.name} enabled`, { provider: provider.name });
              } else {
                console.log(`[Provider] ${provider.name} foi desabilitado`);
                logStore.logProvider(`Provider ${provider.name} disabled`, { provider: provider.name });
              }
            }}
          />
        </div>
        {isUrlConfigurable && provider.settings.enabled && !isDisabledByEnv && (
          <div className="mt-2">
            {envBaseUrl && (
              <label className="block text-xs text-bolt-elements-textSecondary text-green-300 mb-2">
                Set On (.env) : {envBaseUrl}
              </label>
            )}
            <label className="block text-sm text-bolt-elements-textSecondary mb-2">
              {envBaseUrl ? 'Override Base Url' : 'Base URL '}:{' '}
            </label>
            <input
              type="text"
              value={provider.settings.baseUrl || ''}
              onChange={(e) => {
                let newBaseUrl: string | undefined = e.target.value;

                if (newBaseUrl && newBaseUrl.trim().length === 0) {
                  newBaseUrl = undefined;
                }

                updateProviderSettings(provider.name, { ...provider.settings, baseUrl: newBaseUrl });
                logStore.logProvider(`Base URL updated for ${provider.name}`, {
                  provider: provider.name,
                  baseUrl: newBaseUrl,
                });
              }}
              placeholder={`Enter ${provider.name} base URL`}
              className="w-full bg-white dark:bg-bolt-elements-background-depth-4 relative px-2 py-1.5 rounded-md focus:outline-none placeholder-bolt-elements-textTertiary text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary border border-bolt-elements-borderColor"
            />
          </div>
        )}
        {isDisabledByEnv && (
          <div className="mt-2 text-xs text-bolt-elements-textSecondary">
            This provider is disabled in your .env file. Remove it from VITE_DISABLED_PROVIDERS to enable it.
          </div>
        )}
      </div>
    );
  };

  const regularProviders = filteredProviders.filter((p) => !URL_CONFIGURABLE_PROVIDERS.includes(p.name));
  const urlConfigurableProviders = filteredProviders.filter((p) => URL_CONFIGURABLE_PROVIDERS.includes(p.name));

  return (
    <div className="p-4">
      {disabledProviders.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Environment Configuration</h3>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
            Some providers are disabled via your .env file. To enable them, remove them from the VITE_DISABLED_PROVIDERS variable.
            <br />
            Current disabled providers: {disabledProviders.join(', ')}
          </p>
        </div>
      )}

      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Search providers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white dark:bg-bolt-elements-background-depth-4 relative px-2 py-1.5 rounded-md focus:outline-none placeholder-bolt-elements-textTertiary text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary border border-bolt-elements-borderColor"
        />
      </div>

      {/* Regular Providers Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">{regularProviders.map(renderProviderCard)}</div>

      {/* URL Configurable Providers Section */}
      {urlConfigurableProviders.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2 text-bolt-elements-textPrimary">Experimental Providers</h3>
          <p className="text-sm text-bolt-elements-textSecondary mb-4">
            These providers are experimental and allow you to run AI models locally or connect to your own
            infrastructure. They require additional setup but offer more flexibility.
          </p>
          <div className="space-y-4">{urlConfigurableProviders.map(renderProviderCard)}</div>
        </div>
      )}
    </div>
  );
}
