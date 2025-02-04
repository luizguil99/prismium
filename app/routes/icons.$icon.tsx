import type { LoaderFunctionArgs } from '@remix-run/cloudflare';

export async function loader({ params }: LoaderFunctionArgs) {
  const { icon } = params;
  
  try {
    return new Response(null, {
      status: 307, // Temporary redirect
      headers: {
        Location: `/icons/${icon}`,
      },
    });
  } catch (error) {
    throw new Response('Icon not found', { status: 404 });
  }
} 