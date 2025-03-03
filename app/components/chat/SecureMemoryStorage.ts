import Cookies from 'js-cookie';

/**
 * Classe para armazenar dados sensíveis apenas na memória.
 * Isto mantém as chaves apenas na memória durante a sessão do navegador
 * e não as armazena em nenhum lugar persistente como localStorage ou cookies
 */
export class SecureMemoryStorage {
  private static instance: SecureMemoryStorage;
  private storage: Record<string, string> = {};
  private static ENV_PREFIX = "ENV_";
  
  private constructor() {}
  
  /**
   * Obtém a instância da classe (Singleton)
   */
  static getInstance(): SecureMemoryStorage {
    if (!SecureMemoryStorage.instance) {
      SecureMemoryStorage.instance = new SecureMemoryStorage();
    }
    return SecureMemoryStorage.instance;
  }
  
  /**
   * Armazena um valor na memória
   */
  set(key: string, value: string): void {
    this.storage[key] = value;
  }
  
  /**
   * Obtém um valor da memória
   */
  get(key: string): string | undefined {
    return this.storage[key];
  }
  
  /**
   * Salva chaves API na memória
   */
  saveApiKeys(apiKeys: Record<string, string>): void {
    Object.entries(apiKeys).forEach(([provider, key]) => {
      this.set(provider, key);
    });
    
    // Remover cookies antigos para garantir que não há exposição
    Cookies.remove('apiKeys');
    Object.keys(apiKeys).forEach(provider => {
      Cookies.remove(`${provider}_API_KEY`);
    });
  }
  
  /**
   * Obtém todas as chaves API armazenadas
   */
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
  
  /**
   * Armazena uma variável de ambiente na memória
   */
  setEnvVar(name: string, value: string): void {
    this.set(`${SecureMemoryStorage.ENV_PREFIX}${name}`, value);
  }
  
  /**
   * Obtém uma variável de ambiente da memória
   */
  getEnvVar(name: string): string | undefined {
    return this.get(`${SecureMemoryStorage.ENV_PREFIX}${name}`);
  }
  
  /**
   * Limpa todos os dados da memória
   */
  clear(): void {
    this.storage = {};
  }
} 