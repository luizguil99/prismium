import type { AppLoadContext, EntryContext } from '@remix-run/cloudflare';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderToReadableStream } from 'react-dom/server';
import { renderHeadToString } from 'remix-island';
import { Head } from './root';
import { themeStore } from '~/lib/stores/theme';

// Handlers globais para erros não tratados
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Não deixa o processo morrer
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Não deixa o processo morrer
});

// Garantir que o processo não morre em caso de erros de memória
process.on('memoryUsage', (info) => {
  console.warn('⚠️ High memory usage:', info);
});

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  loadContext: AppLoadContext,
) {
  try {
    // await initializeModelList({});

    const readable = await renderToReadableStream(<RemixServer context={remixContext} url={request.url} />, {
      signal: request.signal,
      onError(error: unknown) {
        console.error(error);
        responseStatusCode = 500;
      },
    });

    const body = new ReadableStream({
      start(controller) {
        const head = renderHeadToString({ request, remixContext, Head });

        controller.enqueue(
          new Uint8Array(
            new TextEncoder().encode(
              `<!DOCTYPE html><html lang="en" data-theme="${themeStore.value}"><head>${head}</head><body><div id="root" class="w-full h-full">`,
            ),
          ),
        );

        const reader = readable.getReader();

        function read() {
          reader
            .read()
            .then(({ done, value }) => {
              if (done) {
                controller.enqueue(new Uint8Array(new TextEncoder().encode('</div></body></html>')));
                controller.close();

                return;
              }

              controller.enqueue(value);
              read();
            })
            .catch((error) => {
              controller.error(error);
              readable.cancel();
            });
        }
        read();
      },

      cancel() {
        readable.cancel();
      },
    });

    if (isbot(request.headers.get('user-agent') || '')) {
      await readable.allReady;
    }

    responseHeaders.set('Content-Type', 'text/html');

    responseHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
    responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

    return new Response(body, {
      headers: responseHeaders,
      status: responseStatusCode,
    });
  } catch (error) {
    console.error('❌ Server render error:', error);
    responseStatusCode = 500;
    // Retorna uma resposta mesmo em caso de erro
    return new Response('Internal Server Error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
