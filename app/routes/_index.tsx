import { json, type MetaFunction, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { requireAuth } from '~/lib/auth';

export const meta: MetaFunction = () => {
  return [{ title: 'Prismium' }, { name: 'description', content: 'Talk with Prismium, Your coding assistant' }];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireAuth({ request });
  
  // Obtém os headers da resposta do Supabase
  const response = new Response();
  const headers = response.headers;

  return json({ user }, { headers });
};

export default function Index() {
  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-b from-[#0B0E14] to-[#151922]">
      <BackgroundRays />
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
    </div>
  );
}
