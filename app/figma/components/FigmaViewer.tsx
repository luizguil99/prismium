import React, { useEffect, useState } from 'react';
import { FigmaConverter } from '../services/figmaConverter';
import { Button } from '@/components/ui/ui/button';
import { X, Eye, FileText } from 'lucide-react';
import JSZip from 'jszip';

interface FigmaViewerProps {
  file: File;
  onClose: () => void;
  onConvert: (textContent: string) => void;
}

export const FigmaViewer: React.FC<FigmaViewerProps> = ({ file, onClose, onConvert }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'preview' | 'convert'>('preview');
  const [figmaData, setFigmaData] = useState<any>(null);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const buffer = await file.arrayBuffer();
        const zip = new JSZip();
        
        // Carregar o arquivo .fig como ZIP
        const contents = await zip.loadAsync(buffer);
        
        // Carregar a thumbnail
        const thumbnailFile = contents.file('thumbnail.png');
        if (thumbnailFile) {
          const thumbnailBlob = await thumbnailFile.async('blob');
          const thumbnailUrl = URL.createObjectURL(thumbnailBlob);
          setThumbnail(thumbnailUrl);
        }

        // Carregar os metadados
        const metaFile = contents.file('meta.json');
        if (metaFile) {
          const jsonContent = await metaFile.async('string');
          const data = JSON.parse(jsonContent);
          setFigmaData(data);
        }
      } catch (err) {
        console.error('Erro ao carregar preview:', err);
        setError(`Erro ao carregar preview do arquivo: ${err.message}`);
      }
    };

    loadPreview();

    // Limpar URLs quando o componente for desmontado
    return () => {
      if (thumbnail) {
        URL.revokeObjectURL(thumbnail);
      }
    };
  }, [file]);

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
    <div className="relative p-4 border border-zinc-800 rounded-lg bg-black/95">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-zinc-100">Arquivo Figma: {file.name}</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-zinc-100">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {error && <div className="p-2 text-red-500 bg-red-500/10 rounded mb-4">{error}</div>}

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setCurrentView('preview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            currentView === 'preview' ? 'bg-[#A259FF] text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
          }`}
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
        <button
          onClick={() => setCurrentView('convert')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            currentView === 'convert' ? 'bg-[#A259FF] text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
          }`}
        >
          <FileText className="h-4 w-4" />
          Converter
        </button>
      </div>

      <div className="mt-4">
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
              <div className="p-4 border-t border-zinc-800">
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
        ) : (
          <div className="space-y-4">
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
