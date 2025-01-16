import React, { useEffect, useState } from 'react';
import { FigmaConverter } from '../services/figmaConverter';
import { Button } from '@/components/ui/ui/button';
import { X, Eye, FileText, Layers } from 'lucide-react';
import JSZip from 'jszip';

interface FigmaViewerProps {
  file: File;
  onClose: () => void;
  onConvert: (textContent: string) => void;
}

interface FileDetails {
  arquivos: string[];
  thumbnail: {
    tamanho?: string;
    tipo?: string;
  };
  metadados: any;
  canvas: {
    tamanho?: string;
    primeirosBytes?: string;
  };
  imagens: Array<{
    nome: string;
    tamanho: string;
    tipo: string;
    url: string;
  }>;
}

export const FigmaViewer: React.FC<FigmaViewerProps> = ({ file, onClose, onConvert }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'preview' | 'convert' | 'details'>('preview');
  const [figmaData, setFigmaData] = useState<any>(null);
  const [fileDetails, setFileDetails] = useState<FileDetails>({
    arquivos: [],
    thumbnail: {},
    metadados: null,
    canvas: {},
    imagens: [],
  });

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const buffer = await file.arrayBuffer();
        const zip = new JSZip();

        const contents = await zip.loadAsync(buffer);
        const files = Object.keys(contents.files);
        console.log(' Arquivos encontrados no .fig:', files);

        const details: FileDetails = {
          arquivos: files,
          thumbnail: {},
          metadados: null,
          canvas: {},
          imagens: [],
        };

        // Analisar cada arquivo
        for (const fileName of files) {
          const file = contents.file(fileName);
          if (!file) continue;

          if (fileName === 'thumbnail.png') {
            const thumbnailBlob = await file.async('blob');
            details.thumbnail = {
              tamanho: `${(thumbnailBlob.size / 1024).toFixed(2)} KB`,
              tipo: thumbnailBlob.type,
            };
            const thumbnailUrl = URL.createObjectURL(thumbnailBlob);
            setThumbnail(thumbnailUrl);
          } else if (fileName === 'meta.json') {
            const jsonContent = await file.async('string');
            const data = JSON.parse(jsonContent);
            details.metadados = data;
            setFigmaData(data);
          } else if (fileName === 'canvas.fig') {
            const content = await file.async('arraybuffer');
            details.canvas = {
              tamanho: `${(content.byteLength / 1024).toFixed(2)} KB`,
              primeirosBytes: Array.from(new Uint8Array(content.slice(0, 20)))
                .map((b) => b.toString(16).padStart(2, '0'))
                .join(' '),
            };
          } else if (fileName.startsWith('images/') && !fileName.endsWith('/')) {
            const imageBlob = await file.async('blob');
            const imageUrl = URL.createObjectURL(imageBlob);
            details.imagens.push({
              nome: fileName.split('/').pop() || '',
              tamanho: `${(imageBlob.size / 1024).toFixed(2)} KB`,
              tipo: imageBlob.type,
              url: imageUrl,
            });
          }
        }

        setFileDetails(details);
      } catch (err) {
        console.error(' Erro ao carregar preview:', err);
        setError(`Erro ao carregar preview do arquivo: ${err.message}`);
      }
    };

    loadPreview();

    return () => {
      if (thumbnail) {
        URL.revokeObjectURL(thumbnail);
      }
      // Limpar URLs das imagens
      fileDetails.imagens.forEach((img) => {
        if (img.url) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [file]);

  const renderDetails = () => {
    return (
      <div className="space-y-3">
        <div className="bg-zinc-900/50 rounded-lg p-3">
          <h4 className="font-medium text-zinc-300 mb-2"> Arquivos ({fileDetails.arquivos.length})</h4>
          <ul className="list-disc list-inside text-zinc-400 text-sm">
            {fileDetails.arquivos.map((arquivo, index) => (
              <li key={index}>{arquivo}</li>
            ))}
          </ul>
        </div>

        {fileDetails.thumbnail.tamanho && (
          <div className="bg-zinc-900/50 rounded-lg p-3">
            <h4 className="font-medium text-zinc-300 mb-2"> Thumbnail</h4>
            <div className="text-zinc-400 text-sm">
              <p>Tamanho: {fileDetails.thumbnail.tamanho}</p>
              <p>Tipo: {fileDetails.thumbnail.tipo}</p>
            </div>
          </div>
        )}

        {fileDetails.metadados && (
          <div className="bg-zinc-900/50 rounded-lg p-3">
            <h4 className="font-medium text-zinc-300 mb-2"> Metadados</h4>
            <div className="space-y-1 text-zinc-400 text-sm">
              <p>Nome do arquivo: {fileDetails.metadados.file_name}</p>
              {fileDetails.metadados.client_meta && (
                <>
                  <p>
                    Cor de fundo: rgba(
                    {Math.round(fileDetails.metadados.client_meta.background_color.r * 255)},
                    {Math.round(fileDetails.metadados.client_meta.background_color.g * 255)},
                    {Math.round(fileDetails.metadados.client_meta.background_color.b * 255)},
                    {fileDetails.metadados.client_meta.background_color.a})
                  </p>
                  <p>
                    Dimensões do Canvas: {fileDetails.metadados.client_meta.render_coordinates.width} x{' '}
                    {fileDetails.metadados.client_meta.render_coordinates.height}
                  </p>
                  <p>
                    Posição: x={fileDetails.metadados.client_meta.render_coordinates.x}, y=
                    {fileDetails.metadados.client_meta.render_coordinates.y}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {fileDetails.canvas.tamanho && (
          <div className="bg-zinc-900/50 rounded-lg p-3">
            <h4 className="font-medium text-zinc-300 mb-2"> Canvas</h4>
            <div className="text-zinc-400 text-sm">
              <p>Tamanho: {fileDetails.canvas.tamanho}</p>
              <p className="font-mono text-xs break-all">Primeiros bytes: {fileDetails.canvas.primeirosBytes}</p>
            </div>
          </div>
        )}

        {fileDetails.imagens.length > 0 && (
          <div className="bg-zinc-900/50 rounded-lg p-3">
            <h4 className="font-medium text-zinc-300 mb-2"> Imagens ({fileDetails.imagens.length})</h4>
            <div className="grid grid-cols-2 gap-3">
              {fileDetails.imagens.map((img, index) => (
                <div key={index} className="bg-zinc-800/50 rounded-lg p-2 space-y-2">
                  <div className="h-24 relative bg-zinc-950/50 rounded overflow-hidden">
                    <img src={img.url} alt={img.nome} className="absolute inset-0 w-full h-full object-contain" />
                  </div>
                  <div className="text-xs text-zinc-400">
                    <p className="truncate" title={img.nome}>Nome: {img.nome}</p>
                    <p>Tamanho: {img.tamanho}</p>
                    <p>Tipo: {img.tipo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleConvert = async () => {
    setIsConverting(true);
    setError(null);

    try {
      if (figmaData) {
        const textContent = await FigmaConverter.convertToText(figmaData);
        onConvert(textContent);
      } else {
        throw new Error('Dados do Figma não carregados');
      }
    } catch (err) {
      console.error('Erro na conversão:', err);
      setError('Falha ao converter arquivo Figma');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="relative p-3 border border-zinc-800 rounded-lg bg-black/95 max-h-[600px] overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-zinc-100">Arquivo Figma: {file.name}</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-zinc-100">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {error && <div className="p-2 text-red-500 bg-red-500/10 rounded mb-3">{error}</div>}

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setCurrentView('preview')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            currentView === 'preview' ? 'bg-[#A259FF] text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
          }`}
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
        <button
          onClick={() => setCurrentView('details')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            currentView === 'details' ? 'bg-[#A259FF] text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          Detalhes
        </button>
        <button
          onClick={() => setCurrentView('convert')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            currentView === 'convert' ? 'bg-[#A259FF] text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
          }`}
        >
          <FileText className="h-4 w-4" />
          Converter
        </button>
      </div>

      <div className="mt-3">
        {currentView === 'preview' ? (
          thumbnail ? (
            <div className="w-full bg-zinc-900 rounded-lg overflow-hidden">
              <div className="relative aspect-video">
                <img
                  src={thumbnail}
                  alt="Preview do design Figma"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </div>
              <div className="p-3 border-t border-zinc-800">
                <Button
                  onClick={() => window.open('https://www.figma.com/file/new', '_blank')}
                  className="w-full bg-[#A259FF] hover:bg-[#B37AFF] text-white"
                >
                  Abrir no Figma
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full aspect-video bg-zinc-900/50 rounded-lg flex items-center justify-center">
              <p className="text-zinc-500">Carregando preview...</p>
            </div>
          )
        ) : currentView === 'details' ? (
          renderDetails()
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">
              Converta o arquivo Figma em uma descrição textual que pode ser processada por LLMs.
            </p>
            <Button
              onClick={handleConvert}
              disabled={isConverting}
              className="w-full bg-[#A259FF] hover:bg-[#B37AFF] text-white"
            >
              {isConverting ? 'Convertendo...' : 'Converter para Texto'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
