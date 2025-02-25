/**
 * Utilitário para gerenciar cookies do Supabase
 */

const COOKIE_NAMES = {
  PROJECT_URL: 'supabase_project_url',
  ANON_KEY: 'supabase_anon_key',
  SECRET_KEY: 'supabase_secret_key',
  PROJECT_REF: 'supabase_project_ref',
  PROJECT_NAME: 'supabase_project_name',
  ORG_ID: 'supabase_org_id',
  OAUTH_STATE: 'supabase_oauth_state'
};

const DEFAULT_OPTIONS = {
  PATH: 'path=/',
  SAME_SITE: 'SameSite=Lax',
  SECURE: 'Secure',
  HTTP_ONLY: 'HttpOnly'
};

/**
 * Obtém o valor de um cookie
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

/**
 * Define um cookie com opções personalizadas
 */
export function setCookie(name: string, value: string, maxAgeSeconds?: number): void {
  if (typeof document === 'undefined') return;
  
  const options = [DEFAULT_OPTIONS.PATH, DEFAULT_OPTIONS.SAME_SITE];
  
  if (location.protocol === 'https:') {
    options.push(DEFAULT_OPTIONS.SECURE);
  }
  
  if (maxAgeSeconds) {
    options.push(`max-age=${maxAgeSeconds}`);
  }
  
  document.cookie = `${name}=${value}; ${options.join('; ')}`;
}

/**
 * Remove um cookie
 */
export function removeCookie(name: string): void {
  setCookie(name, '', 0);
}

/**
 * Verifica se os cookies do Supabase existem
 */
export function hasSupabaseCookies(): boolean {
  return !!(
    getCookie(COOKIE_NAMES.PROJECT_URL) &&
    getCookie(COOKIE_NAMES.ANON_KEY) &&
    getCookie(COOKIE_NAMES.PROJECT_REF)
  );
}

/**
 * Obtém as credenciais do Supabase dos cookies
 */
export function getSupabaseCredentials() {
  return {
    projectUrl: getCookie(COOKIE_NAMES.PROJECT_URL),
    anonKey: getCookie(COOKIE_NAMES.ANON_KEY),
    secretKey: getCookie(COOKIE_NAMES.SECRET_KEY),
    projectRef: getCookie(COOKIE_NAMES.PROJECT_REF),
    projectName: getCookie(COOKIE_NAMES.PROJECT_NAME),
    orgId: getCookie(COOKIE_NAMES.ORG_ID)
  };
}

/**
 * Salva as credenciais do Supabase em cookies
 */
export function saveSupabaseCredentials(
  projectUrl: string,
  anonKey: string,
  projectId: string,
  projectName: string,
  organizationId?: string,
  secretKey?: string
): void {
  // 1 ano em segundos
  const ONE_YEAR = 31536000;
  
  setCookie(COOKIE_NAMES.PROJECT_URL, projectUrl, ONE_YEAR);
  setCookie(COOKIE_NAMES.ANON_KEY, anonKey, ONE_YEAR);
  setCookie(COOKIE_NAMES.PROJECT_REF, projectId, ONE_YEAR);
  setCookie(COOKIE_NAMES.PROJECT_NAME, projectName, ONE_YEAR);
  
  if (organizationId) {
    setCookie(COOKIE_NAMES.ORG_ID, organizationId, ONE_YEAR);
  }
  
  if (secretKey) {
    setCookie(COOKIE_NAMES.SECRET_KEY, secretKey, ONE_YEAR);
  }
}

/**
 * Salva o estado OAuth para o fluxo de autenticação
 */
export function saveOAuthState(state: string): void {
  // 10 minutos em segundos
  const TEN_MINUTES = 600;
  setCookie(COOKIE_NAMES.OAUTH_STATE, state, TEN_MINUTES);
}

/**
 * Limpa o estado OAuth
 */
export function clearOAuthState(): void {
  removeCookie(COOKIE_NAMES.OAUTH_STATE);
}

/**
 * Limpa todos os cookies relacionados ao Supabase
 */
export function clearAllSupabaseCookies(): void {
  Object.values(COOKIE_NAMES).forEach(name => {
    removeCookie(name);
  });
}

export default {
  getCookie,
  setCookie,
  removeCookie,
  hasSupabaseCookies,
  getSupabaseCredentials,
  saveSupabaseCredentials,
  saveOAuthState,
  clearOAuthState,
  clearAllSupabaseCookies,
  COOKIE_NAMES
}; 