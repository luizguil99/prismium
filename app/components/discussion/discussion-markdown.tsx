import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { CodeMarkdown } from './code-markdown';

interface DiscussionMarkdownProps {
  content: string;
}

const KEYWORDS = [
  'useState', 'useEffect', 'useContext', 'useRef', 'localStorage',
  'setTimeout', 'setInterval', 'React', 'JSX', 'App', 'let', 'const',
  'var', 'true', 'false', 'null', 'undefined', 'String', 'Number',
  'Boolean', 'Array', 'Object', 'Function', 'Promise', 'async', 'await'
];

const CODE_PATTERNS = [
  // Funções e métodos
  /\w+\s*\([^)]*\)/,
  // Operadores
  /[+\-*/%]=|[&|^]=|<<=|>>=|>>>=|\+\+|--|&&|\|\||[<>]=?|===|!==|[+\-*/%&|^!~?]/,
  // Declarações
  /\b(const|let|var|function|class|interface|type|import|export)\s+\w+/,
  // Arrays e objetos
  /[\[{]\s*[\w\s,'"]*[\]}]/,
  // Template strings
  /`[^`]*`/,
  // Strings com aspas
  /'[^']*'|"[^"]*"/,
  // JSX
  /<[^>]+>/,
  // Números
  /\b\d+\.?\d*\b/,
  // Atribuições
  /\w+\s*=\s*[^;]+/
];

// Mapeamento de palavras-chave para emojis
const TITLE_EMOJIS: Record<string, string> = {
  // Desenvolvimento
  'código': '💻', 'code': '💻', 'programação': '👨‍💻', 'programming': '👨‍💻',
  'bug': '🐛', 'debug': '🔍', 'feature': '✨', 'performance': '⚡',
  'api': '🔌', 'database': '🗄️', 'dados': '📊', 'data': '📊',
  'teste': '🧪', 'test': '🧪', 'deploy': '🚀', 'release': '📦',
  
  // Tópicos comuns
  'exemplo': '📝', 'example': '📝', 'nota': '📝', 'note': '📝',
  'importante': '⚠️', 'important': '⚠️', 'aviso': '⚠️', 'warning': '⚠️',
  'dica': '💡', 'tip': '💡', 'solução': '✅', 'solution': '✅',
  'problema': '❌', 'problem': '❌', 'erro': '❌', 'error': '❌',
  
  // Áreas específicas
  'frontend': '🎨', 'backend': '⚙️', 'design': '🎯', 'ui': '🎨',
  'ux': '👥', 'mobile': '📱', 'web': '🌐', 'cloud': '☁️',
  'segurança': '🔒', 'security': '🔒', 'análise': '📊', 'analysis': '📊',
  
  // Status
  'pendente': '⏳', 'pending': '⏳', 'completo': '✅', 'complete': '✅',
  'em progresso': '🚧', 'in progress': '🚧', 'revisão': '👀', 'review': '👀',
  
  // Documentação
  'documentação': '📚', 'documentation': '📚', 'guia': '📖', 'guide': '📖',
  'tutorial': '📝', 'referência': '📚', 'reference': '📚',
  
  // Genéricos
  'novo': '🆕', 'new': '🆕', 'atualização': '🔄', 'update': '🔄',
  'configuração': '⚙️', 'config': '⚙️', 'setup': '🛠️',
  'resumo': '📋', 'summary': '📋', 'lista': '📋', 'list': '📋',
  
  // Específicos
  'react': '⚛️', 'vue': '💚', 'angular': '🅰️', 'node': '💚',
  'python': '🐍', 'java': '☕', 'javascript': '💛', 'typescript': '💙',
  'docker': '🐳', 'kubernetes': '⛵', 'git': '📦', 'github': '🐱',
  
  // Domínios
  'ai': '🤖', 'ml': '🧠', 'data science': '📊', 'blockchain': '⛓️',
  'iot': '🔌', 'cloud': '☁️', 'devops': '🔄', 'security': '🔒'
};

const getEmojiForTitle = (title: string): string => {
  const lowerTitle = title.toLowerCase();
  
  // Procura por palavras-chave no título
  for (const [keyword, emoji] of Object.entries(TITLE_EMOJIS)) {
    if (lowerTitle.includes(keyword.toLowerCase())) {
      return emoji + ' ';
    }
  }
  
  // Emoji padrão se nenhuma palavra-chave for encontrada
  return '📌 ';
};

export function DiscussionMarkdown({ content }: DiscussionMarkdownProps) {
  const renderCode = (code: string, inline: boolean = false, lang: string = '') => {
    const trimmed = code.trim();
    const isKeyword = KEYWORDS.includes(trimmed);
    const isSimpleWord = !trimmed.includes(' ') && !/[^\w]/.test(trimmed);
    
    // Se for uma palavra-chave ou palavra simples, sempre renderiza como inline
    if (isKeyword || isSimpleWord || trimmed.length < 15) {
      return (
        <code 
          className={`px-1.5 py-0.5 rounded-md font-mono text-sm ${
            isKeyword ? 'bg-blue-500/10 text-blue-400 font-semibold' : 'bg-zinc-900/50 text-zinc-200'
          }`}
        >
          {trimmed}
        </code>
      );
    }

    // Se não tiver nenhum padrão de código, também renderiza como inline
    if (!CODE_PATTERNS.some(pattern => pattern.test(trimmed))) {
      return (
        <code className="bg-zinc-900/50 px-1.5 py-0.5 rounded-md font-mono text-sm text-zinc-200">
          {trimmed}
        </code>
      );
    }

    // Se chegou aqui, é um bloco de código válido
    return <CodeMarkdown code={trimmed} language={lang} />;
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
      components={{
        code({ inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const lang = match ? match[1] : '';
          const code = String(children).replace(/^\s*\d+\s*/, '').trim();
          
          return renderCode(code, inline, lang);
        },
        p: ({ children, ...props }: any) => (
          <p className="mb-4 text-[16px] leading-7" {...props}>
            {children}
          </p>
        ),
        h1: ({ children, ...props }: any) => (
          <h1 className="mt-8 mb-6 text-4xl font-bold flex items-center gap-2" {...props}>
            <span>{getEmojiForTitle(String(children))}</span>
            <span>{children}</span>
          </h1>
        ),
        h2: ({ children, ...props }: any) => (
          <h2 className="mt-8 mb-5 text-3xl font-bold flex items-center gap-2" {...props}>
            <span>{getEmojiForTitle(String(children))}</span>
            <span>{children}</span>
          </h2>
        ),
        h3: ({ children, ...props }: any) => (
          <h3 className="mt-6 mb-4 text-2xl font-bold flex items-center gap-2" {...props}>
            <span>{getEmojiForTitle(String(children))}</span>
            <span>{children}</span>
          </h3>
        ),
        ul: ({ children, ...props }: any) => (
          <ul className="mb-4 list-none space-y-2" {...props}>
            {children}
          </ul>
        ),
        ol: ({ children, ...props }: any) => (
          <ol className="mb-4 list-none space-y-2 [counter-reset:item]" {...props}>
            {children}
          </ol>
        ),
        li: ({ children, ordered, ...props }: any) => {
          if (ordered) {
            return (
              <li className="flex gap-2 text-[16px] leading-7 [counter-increment:item] before:content-[counter(item)'.'] before:font-medium before:text-zinc-500" {...props}>
                <span className="flex-1">{children}</span>
              </li>
            );
          }
          return (
            <li className="flex gap-2 text-[16px] leading-7" {...props}>
              <span className="text-zinc-500">•</span>
              <span className="flex-1">{children}</span>
            </li>
          );
        },
        a: ({ children, ...props }: any) => (
          <a className="text-blue-500 hover:text-blue-600 underline" {...props}>
            {children}
          </a>
        ),
        strong: ({ children, ...props }: any) => {
          const text = String(children);
          const isKeyword = KEYWORDS.includes(text);
          return (
            <strong 
              className={`font-semibold ${isKeyword ? 'text-blue-400' : 'text-zinc-200'}`} 
              {...props}
            >
              {children}
            </strong>
          );
        },
        blockquote: ({ children, ...props }: any) => (
          <blockquote className="pl-4 border-l-2 border-zinc-700 text-zinc-400 italic" {...props}>
            {children}
          </blockquote>
        ),
        // Novos componentes para tabelas
        table: ({ children, ...props }: any) => (
          <div className="my-6 w-full overflow-x-auto rounded-lg border border-zinc-800/50">
            <table className="w-full border-collapse text-left text-sm" {...props}>
              {children}
            </table>
          </div>
        ),
        thead: ({ children, ...props }: any) => (
          <thead className="text-zinc-300 bg-zinc-900/50 border-b border-zinc-800/50" {...props}>
            {children}
          </thead>
        ),
        tbody: ({ children, ...props }: any) => (
          <tbody className="divide-y divide-zinc-800/50" {...props}>
            {children}
          </tbody>
        ),
        tr: ({ children, ...props }: any) => (
          <tr className="hover:bg-zinc-800/30 transition-colors" {...props}>
            {children}
          </tr>
        ),
        th: ({ children, ...props }: any) => (
          <th className="px-4 py-3 font-medium text-zinc-200" {...props}>
            {children}
          </th>
        ),
        td: ({ children, ...props }: any) => (
          <td className="px-4 py-3 text-zinc-300" {...props}>
            {children}
          </td>
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
