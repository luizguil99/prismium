import type { LoaderFunctionArgs } from '@remix-run/node';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const imageUrl = url.searchParams.get('url');

  if (!imageUrl) {
    return new Response('URL não fornecida', { status: 400 });
  }

  try {
    const response = await fetch(imageUrl);
    const headers = new Headers(response.headers);
    
    // Configurar headers CORS
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    return new Response('Erro ao buscar imagem', { status: 500 });
  }
}
