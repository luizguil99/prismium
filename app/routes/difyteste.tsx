import { useState } from 'react';

export default function DifyTeste() {
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState('app-4BBwXRVvg652KwZjXRoJibOS'); // API key padrão
  const [response, setResponse] = useState<any[]>([]);
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testDify = async () => {
    try {
      setLoading(true);
      setError('');
      setResponse([]);
      setResponseText('');

      console.log('Iniciando teste com:', { prompt, apiKey });

      const response = await fetch('https://api.dify.ai/v1/chat-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          inputs: {},
          query: prompt,
          response_mode: 'streaming',
          user: 'test-user'
        })
      });

      console.log('Status:', response.status);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream finalizado');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || !line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));
            console.log('Chunk recebido:', data);
            setResponse(prev => [...prev, data]);
            
            // Atualiza o texto da resposta se for uma mensagem com resposta
            if (data.event === 'agent_message' && data.answer) {
              setResponseText(prev => prev + data.answer);
            }
          } catch (e) {
            console.error('Erro ao processar chunk:', e);
          }
        }
      }

    } catch (error: any) {
      console.error('Erro:', error);
      setError(error?.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Teste do Dify</h1>
      
      <div className="mb-4">
        <label className="block mb-2">
          API Key: (padrão já configurado)
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Insira sua API Key do Dify"
          />
        </label>
      </div>

      <div className="mb-4">
        <label className="block mb-2">
          Prompt:
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-2 border rounded"
            rows={4}
            placeholder="Digite seu prompt aqui"
          />
        </label>
      </div>

      <button
        onClick={testDify}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
      >
        {loading ? 'Enviando...' : 'Enviar Prompt'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-2">Resposta em Texto:</h2>
          <div className="border-2 border-blue-200 rounded p-4 bg-blue-50 min-h-[100px] whitespace-pre-wrap text-lg">
            {responseText || 'Aguardando resposta...'}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">Resposta Completa (JSON):</h2>
          <div className="border rounded p-4 bg-gray-50 min-h-[200px] whitespace-pre-wrap">
            {response.map((chunk, index) => (
              <div key={index} className="mb-2">
                <pre className="text-sm">
                  {JSON.stringify(chunk, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 