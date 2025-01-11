import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';

export const meta: MetaFunction = () => {
  return [
    { title: 'Prismium' }, 
    { name: 'description', content: 'Talk with Prismium, Your coding assistant' }
  ];
};

export const loader = () => json({});

export default function Index() {
  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-b from-[#0B0E14] to-[#151922]">
      <BackgroundRays />
      <Header />
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
    </div>
  );
}
