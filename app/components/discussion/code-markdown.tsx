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
        // Remove apenas números de linha no início quando seguidos de '|' ou '.'
        line = line.replace(/^\s*\d+[\s|.]+/, '');
        
        // Remove caracteres de controle e espaços extras
        line = line.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        
        // Se a linha contiver apenas palavras soltas sem significado de código, remova
        if (line.trim() && !/[(){}\[\]<>=+\-*/%&|^!~?:;,.]/.test(line) && 
            !/^(const|let|var|function|class|interface|type|import|export|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|delete|typeof|instanceof|void|null|undefined|true|false|public|private|protected|static|async|await|extends|implements|module|namespace|package|yield|with|debugger|default|enum|goto|in|this|super|any|as|is|from|get|set|of|new|target|abstract|boolean|byte|char|double|final|float|int|long|native|short|synchronized|throws|transient|volatile)/.test(line.trim())) {
          // Mantém a linha se ela tiver indentação ou parecer parte de uma estrutura
          if (line.startsWith(' ') || line.startsWith('\t')) {
            return line;
          }
          return '';
        }
        
        return line;
      })
      .filter(line => line !== null) // Mantém linhas vazias para preservar estrutura
      .join('\n');
  };

  const processedCode = cleanCode(code);

  // Detecta se é um bloco de código simples ou complexo
  const isSimpleCode = processedCode.split('\n').length <= 3 && processedCode.length < 100;

  // Se for código simples, renderiza inline
  if (isSimpleCode) {
    return (
      <code className="px-2 py-1 rounded-md font-mono text-sm bg-zinc-900/50 text-zinc-200 border border-zinc-800/30">
        {processedCode}
      </code>
    );
  }

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
              padding: '1rem 0',
            },
            'code[class*="language-"]': {
              ...vscDarkPlus['code[class*="language-"]'],
              background: '#101012',
              padding: '0 1rem',
            }
          }}
          customStyle={{
            margin: 0,
            background: '#101012',
            padding: '1rem',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
          }}
          showLineNumbers={true}
          wrapLines={true}
          wrapLongLines={true}
          lineNumberStyle={{
            minWidth: '2.5em',
            paddingRight: '1em',
            color: '#666',
            textAlign: 'right',
            borderRight: '1px solid #333',
            marginRight: '1em',
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