import { createServerClient as createServerClientGeneric } from "@supabase/ssr";
import type { Database } from "~/types/supabase";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Configuração do Supabase não encontrada. Verifique se as variáveis SUPABASE_URL e SUPABASE_ANON_KEY estão definidas no .env');
}

export const createServerClient = (request: Request, response: Response) => {
  return createServerClientGeneric<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      request,
      response,
      cookies: {
        get: (key) => request.headers.get('cookie')?.split(';').find(c => c.trim().startsWith(`${key}=`))?.split('=')[1],
        set: (key, value, options) => {
          response.headers.append('Set-Cookie', `${key}=${value}${options?.path ? `; Path=${options.path}` : ''}`);
        },
        remove: (key, options) => {
          response.headers.append('Set-Cookie', `${key}=; Max-Age=0${options?.path ? `; Path=${options.path}` : ''}`);
        }
      }
    }
  );
};