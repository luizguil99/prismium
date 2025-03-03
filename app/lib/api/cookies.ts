import Cookies from 'js-cookie';

// Função para obter todos os cookies como objeto
export function getAllCookies(): Record<string, string> {
  return Cookies.get();
}

// Função para obter um cookie específico
export function getCookie(name: string): string | undefined {
  return Cookies.get(name);
}

// Função para definir um cookie
export function setCookie(name: string, value: string, options?: Cookies.CookieAttributes): void {
  Cookies.set(name, value, options);
}

// Função para remover um cookie
export function removeCookie(name: string, options?: Cookies.CookieAttributes): void {
  Cookies.remove(name, options);
}

// Função para obter cookies de API
export function getApiCookies(): Record<string, string> {
  const cookies = getAllCookies();
  const apiCookies: Record<string, string> = {};

  Object.keys(cookies).forEach((key) => {
    if (key.toLowerCase().includes('api_key') || key.toLowerCase().includes('apikey')) {
      apiCookies[key] = cookies[key];
    }
  });

  return apiCookies;
}

// Função para obter cookies de modelo
export function getModelCookies(): Record<string, string> {
  const cookies = getAllCookies();
  const modelCookies: Record<string, string> = {};

  Object.keys(cookies).forEach((key) => {
    if (key.toLowerCase().includes('model') || key.toLowerCase().includes('provider')) {
      modelCookies[key] = cookies[key];
    }
  });

  return modelCookies;
}

// Função para limpar todos os cookies
export function clearAllCookies(): void {
  const cookies = getAllCookies();
  Object.keys(cookies).forEach((key) => {
    removeCookie(key);
  });
}

export function parseCookies(cookieHeader: string | null) {
    const cookies: Record<string, string> = {};
  
    if (!cookieHeader) {
      return cookies;
    }
  
    // Split the cookie string by semicolons and spaces
    const items = cookieHeader.split(';').map((cookie) => cookie.trim());
  
    items.forEach((item) => {
      const [name, ...rest] = item.split('=');
  
      if (name && rest.length > 0) {
        // Decode the name and value, and join value parts in case it contains '='
        const decodedName = decodeURIComponent(name.trim());
        const decodedValue = decodeURIComponent(rest.join('=').trim());
        cookies[decodedName] = decodedValue;
      }
    });
  
    return cookies;
  }
  
  export function getApiKeysFromCookie(cookieHeader: string | null): Record<string, string> {
    // No lado do servidor, ainda tentamos ler do cookie por compatibilidade
    const cookies = parseCookies(cookieHeader);
    return cookies.apiKeys ? JSON.parse(cookies.apiKeys) : {};
  }
  
  export function getProviderSettingsFromCookie(cookieHeader: string | null): Record<string, any> {
    const cookies = parseCookies(cookieHeader);
    return cookies.providers ? JSON.parse(cookies.providers) : {};
  }
  