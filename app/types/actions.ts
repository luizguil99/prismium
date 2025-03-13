import type { Change } from 'diff';

export type ActionType = 'file' | 'shell' | 'start' | 'update' | 'delete';

export interface BaseAction {
  content: string;
}

export interface FileAction extends BaseAction {
  type: 'file';
  filePath: string;
}

export interface ShellAction extends BaseAction {
  type: 'shell';
}

export interface StartAction extends BaseAction {
  type: 'start';
}

export interface UpdateAction extends BaseAction {
  type: 'update';
  filePath: string;
  lineStart: number;
  lineEnd: number;
  content: string;
  changeSource?: string; // Adicionando para compatibilidade com outras ações
}

export interface DeleteAction extends BaseAction {
  type: 'delete';
  filePath: string;
  lineStart: number;
  lineEnd: number;
  changeSource?: string; // Adicionando para compatibilidade com outras ações
}

export type BoltAction = FileAction | ShellAction | StartAction | UpdateAction | DeleteAction | BuildAction;

export type BoltActionData = BoltAction | BaseAction;

export interface ActionAlert {
  type: string;
  title: string;
  description: string;
  content: string;
  source?: 'terminal' | 'preview'; // Add source to differentiate between terminal and preview errors
}

export interface FileHistory {
  originalContent: string;
  lastModified: number;
  changes: Change[];
  versions: {
    timestamp: number;
    content: string;
  }[];
  // Novo campo para rastrear a origem das mudanças
  changeSource?: 'user' | 'auto-save' | 'external';
}