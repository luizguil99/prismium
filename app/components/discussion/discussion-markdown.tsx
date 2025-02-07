import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { toast } from 'react-toastify';

interface DiscussionMarkdownProps {
  content: string;
}

const formatMarkdownContent = (content: string): string => {
  // Formata títulos principais com destaque
  content = content.replace(/^# (.*)/gm, (_, title) => {
    const words = title.split(' ');
    const highlightedWords = words.map(word => {
      // Destaca palavras importantes em títulos
      if (word.length > 3 && /^[A-Z]/.test(word)) {
        return `**${word}**`;
      }
      return word;
    });
    return `# ${highlightedWords.join(' ')}`;
  });

  // Formata subtítulos
  content = content.replace(/^## (.*)/gm, '## 🔍 $1');
  content = content.replace(/^### (.*)/gm, '### 📌 $1');

  // Formata datas e números para não aparecerem como código
  content = content.replace(/\b(\d{4})\b/g, '_$1_'); // Anos como itálico
  content = content.replace(/\b(\d+)\b/g, '$1'); // Outros números como texto normal

  // Formata listas numeradas com emojis e destaque
  content = content.replace(/^(\d+)\. (.*?):/gm, (_, num, title) => {
    const emojis = ['📍', '💫', '🔹', '✨', '💡', '🎯', '📌', '🔍', '💭', '📝'];
    const emoji = emojis[Number(num) % emojis.length];
    return `${num}. ${emoji} **${title}:**`;
  });

  // Formata listas com bullets personalizados
  content = content.replace(/^- (.*)/gm, '• $1');
  content = content.replace(/^• ([^:]+):/gm, '• **$1:**');

  // Destaca termos importantes
  content = content.replace(/\b(War|World|Great|Allied?s?|Axis|Treaty|League|Nations|Depression)\b/g, '**$1**');
  
  // Destaca países e locais
  content = content.replace(/\b(Germany|France|Britain|Italy|Japan|USA|Soviet Union|Austria|Czechoslovakia)\b/g, '**$1**');

  // Adiciona separadores visuais antes de seções importantes
  content = content.replace(/\n(\d+)\. 📍/g, '\n\n---\n\n$1. 📍');

  return content;
};

export function DiscussionMarkdown({ content }: DiscussionMarkdownProps) {
  const formattedContent = formatMarkdownContent(content);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
      components={{
        code({ inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const lang = match ? match[1] : '';
          
          if (inline) {
            return (
              <code className="px-2 py-1 rounded-md bg-zinc-800/80 font-mono text-sm text-blue-400 border border-zinc-700/50" {...props}>
                {children}
              </code>
            );
          }

          return (
            <div className="relative group my-8 rounded-xl overflow-hidden border border-zinc-800/80 bg-zinc-900/50">
              {lang && (
                <div className="absolute top-0 right-0 px-4 py-2 text-xs font-medium text-zinc-400 bg-zinc-800/90 rounded-bl-lg border-l border-b border-zinc-700/50">
                  {lang.toUpperCase()}
                </div>
              )}
              <SyntaxHighlighter
                language={lang || 'text'}
                style={vscDarkPlus}
                PreTag="div"
                className="!bg-transparent !p-6 text-[14px] leading-6"
                showLineNumbers={true}
                customStyle={{
                  margin: 0,
                  background: 'transparent',
                  padding: '2rem'
                }}
                wrapLongLines={true}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(String(children));
                  toast.success('Código copiado! 📋');
                }}
                className="absolute top-4 right-16 p-2 rounded-lg bg-zinc-800/90 text-zinc-400 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:text-blue-400 hover:bg-zinc-800 border border-zinc-700/50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              </button>
            </div>
          );
        },
        p: ({ children }) => (
          <p className="mb-6 last:mb-0 text-zinc-300 leading-relaxed text-[16px] tracking-wide">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="mb-6 space-y-3 text-zinc-300 pl-6">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-6 space-y-4 text-zinc-300 pl-6 list-decimal">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed text-[16px] relative pl-2">
            {children}
          </li>
        ),
        h1: ({ children }) => (
          <h1 className="text-4xl font-bold mb-8 mt-12 first:mt-0 bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent tracking-tight leading-tight">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl font-bold mb-6 mt-10 bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent tracking-tight">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl font-bold mb-4 mt-8 text-zinc-100 tracking-tight">
            {children}
          </h3>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-6 border-l-4 border-blue-500 pl-6 py-4 bg-blue-500/5 rounded-r-xl">
            <p className="text-zinc-300 italic text-[16px] leading-relaxed">{children}</p>
          </blockquote>
        ),
        hr: () => (
          <hr className="my-12 border-zinc-800/50" />
        ),
        table: ({ children }) => (
          <div className="my-8 overflow-x-auto rounded-xl border border-zinc-800/50 bg-zinc-900/30">
            <table className="w-full border-collapse">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="px-6 py-4 bg-zinc-800/50 text-left text-sm font-bold text-zinc-200 uppercase tracking-wider border-b border-zinc-700/50">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-6 py-4 text-[15px] text-zinc-300 border-b border-zinc-800/50">
            {children}
          </td>
        ),
        a: ({ children, href }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 hover:decoration-blue-300/50 transition-all duration-200 font-medium"
          >
            {children}
          </a>
        ),
        img: ({ src, alt }) => (
          <div className="my-8">
            <img 
              src={src} 
              alt={alt} 
              className="w-full h-auto rounded-xl border border-zinc-800/50 shadow-2xl" 
            />
            {alt && (
              <p className="mt-4 text-sm text-zinc-500 text-center italic">
                {alt}
              </p>
            )}
          </div>
        ),
        strong: ({ children }) => (
          <strong className="font-bold text-zinc-50">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic text-zinc-400">
            {children}
          </em>
        )
      }}
    >
      {formattedContent}
    </ReactMarkdown>
  );
}
