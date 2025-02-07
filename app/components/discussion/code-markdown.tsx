import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CodeMarkdownProps {
  code: string;
  language?: string;
}

export function CodeMarkdown({ code, language = 'typescript' }: CodeMarkdownProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Limpa o código removendo palavras soltas e formatação desnecessária
  const cleanCode = (code: string) => {
    return code
      .split('\n')
      .map(line => {
        // Remove números no início
        line = line.replace(/^\s*\d+\s*/, '');
        
        // Remove palavras soltas que não fazem parte do código
        if (!/[(){}\[\]<>=+\-*/%&|^!~?:;,.]/.test(line) && 
            !/^(const|let|var|function|class|interface|type|import|export|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|delete|typeof|instanceof|void|null|undefined|true|false)/.test(line.trim())) {
          return '';
        }
        
        return line;
      })
      .filter(line => line.trim()) // Remove linhas vazias
      .join('\n')
      .trim();
  };

  const processedCode = cleanCode(code);

  return (
    <div className="relative group my-4">
      <div className="absolute right-2 top-2 flex gap-2">
        <button
          onClick={handleCopy}
          className="p-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-400 hover:text-zinc-200 rounded-lg transition-all duration-200 border border-zinc-700/50 opacity-0 group-hover:opacity-100"
          title="Copiar código"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
      </div>
      <div className="rounded-lg overflow-hidden bg-[#101012] border border-zinc-800/20">
        <SyntaxHighlighter
          language={language}
          style={{
            ...vscDarkPlus,
            'pre[class*="language-"]': {
              ...vscDarkPlus['pre[class*="language-"]'],
              background: '#101012',
              margin: 0,
            },
            'code[class*="language-"]': {
              ...vscDarkPlus['code[class*="language-"]'],
              background: '#101012',
            }
          }}
          customStyle={{
            margin: 0,
            background: '#101012',
            padding: '1rem',
            fontSize: '0.875rem',
            lineHeight: '1.5',
          }}
          showLineNumbers={true}
          lineNumberStyle={{
            minWidth: '2em',
            paddingRight: '1em',
            color: '#666',
            textAlign: 'right',
          }}
          className="!m-0"
          PreTag="div"
        >
          {processedCode}
        </SyntaxHighlighter>
      </div>
    </div>
  );
} 