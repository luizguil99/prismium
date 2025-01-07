export interface Template {
  id: number;
  title: string;
  description: string;
  repo: string;
  tags: string[];
}

export const templates = [
  {
    id: 1,
    title: 'Shadcn + JavaScript',
    description: 'Template com Shadcn UI e JavaScript',
    repo: 'https://github.com/luizguil99/Shadcn-js-template',
    tags: ['javascript', 'shadcn', 'tailwind'],
  },
  {
    id: 2,
    title: 'Shadcn + TypeScript',
    description: 'Template com Shadcn UI e TypeScript',
    repo: 'https://github.com/shadcn/ui',
    tags: ['typescript', 'shadcn', 'tailwind'],
  },
];
