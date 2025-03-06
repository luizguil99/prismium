import { atom } from 'nanostores';
import type { Message } from 'ai';

// Store para as mensagens do RevertDropdown
export const revertDropdownMessages = atom<Message[]>([]);

// Store para o chatId
export const revertDropdownChatId = atom<string | null>(null);

// Função para atualizar as mensagens
export function updateRevertDropdownMessages(messages: Message[]) {
  revertDropdownMessages.set(messages);
}

// Função para atualizar o chatId
export function updateRevertDropdownChatId(chatId: string) {
  revertDropdownChatId.set(chatId);
} 