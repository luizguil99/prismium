// see https://docs.anthropic.com/en/docs/about-claude/models
export const MAX_TOKENS = 8000;

// limits the number of model responses that can be returned in a single request
export const MAX_RESPONSE_SEGMENTS = 2;

// Interface para o mapa de arquivos
export interface FileMap {
  [key: string]: {
    content: string;
    type: string;
  };
}

// Padrões comuns para ignorar, similar ao .gitignore
export const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '*.log',
  '*.lock',
  '.env*',
  '.DS_Store'
];
