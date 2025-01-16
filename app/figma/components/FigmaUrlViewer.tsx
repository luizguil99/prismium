import React, { useState } from 'react';
import { Button } from '@/components/ui/ui/button';
import { Input } from '@/components/ui/ui/input';
import { X, Link } from 'lucide-react';

interface FigmaUrlViewerProps {
  onClose: () => void;
  onConvert: (textContent: string) => void;
}

// Função para extrair o ID do projeto da URL do Figma
const extractFigmaId = (url: string): string | null => {
  // Suporta formatos de URL do Figma como:
  // https://www.figma.com/file/xxxxx/nome-do-projeto
  // https://www.figma.com/design/xxxxx/nome-do-projeto
  const matches = url.match(/figma\.com\/(file|design)\/([a-zA-Z0-9]+)/);
  return matches ? matches[2] : null;
};

export const FigmaUrlViewer: React.FC<FigmaUrlViewerProps> = ({ onClose, onConvert }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const figmaId = extractFigmaId(url);
      if (!figmaId) {
        throw new Error('URL do Figma inválida. Por favor, insira uma URL válida do Figma.');
      }

      // Aqui você pode adicionar a lógica para obter os dados do projeto do Figma
      // usando a API do Figma com o figmaId

      // Por enquanto, vamos apenas simular a conversão
      const description = `Projeto Figma ID: ${figmaId}\nURL: ${url}`;
      onConvert(description);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar URL do Figma');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-500 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-4 text-xl font-semibold">Importar Projeto do Figma</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="figmaUrl" className="mb-2 block text-sm font-medium text-gray-700">
              URL do Projeto Figma
            </label>
            <div className="flex gap-2">
              <Input
                id="figmaUrl"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.figma.com/file/..."
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading}>
                <Link className="mr-2 h-4 w-4" />
                {isLoading ? 'Processando...' : 'Importar'}
              </Button>
            </div>
          </div>

          {error && <div className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        </form>

        <div className="mt-4 text-sm text-gray-600">
          <p>Cole a URL do seu projeto Figma para importá-lo.</p>
          <p>Exemplo: https://www.figma.com/file/xxxxx/nome-do-projeto</p>
        </div>
      </div>
    </div>
  );
};
