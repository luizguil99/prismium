import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { default as IndexRoute } from './_index';
import { requireAuth } from '~/lib/auth';
import { useLoaderData } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';

export async function loader(args: LoaderFunctionArgs) {
  return json({ id: args.params.id });
}

export default function ChatRoute() {
  const { id } = useLoaderData<typeof loader>();
  
  return (
    <ClientOnly fallback={null}>
      {() => <IndexRoute />}
    </ClientOnly>
  );
}
