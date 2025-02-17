import { createServerClient as createServerClientGeneric } from "@supabase/auth-helpers-remix";
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
    { request, response }
  );
}; 