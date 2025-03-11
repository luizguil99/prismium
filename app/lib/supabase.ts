import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase configuration not found. Verify that SUPABASE_URL and SUPABASE_ANON_KEY variables are defined in .env',
  );
  throw new Error('Supabase configuration not found');
}

export const createBrowserClient = () => {
  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
};

export const createServerClient = (request: Request, response: Response) => {
  return createSupabaseServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get: (name: string) => request.headers.get('cookie') ?? '',
        set: (name: string, value: string, options: any) => {
          response.headers.set(
            'set-cookie',
            `${name}=${value}; Path=/; SameSite=Lax;${options?.secure ? ' Secure' : ''}`,
          );
        },
        remove: (name: string) => {
          response.headers.set(
            'set-cookie',
            `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
          );
        },
      },
    },
  );
};