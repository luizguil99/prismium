import { getOrCreateClient } from '~/components/supabase/client';
import type { Message } from 'ai';

// Abstração para acessar o cliente Supabase (ao invés de abrir o IndexedDB)
export async function openDatabase() {
  return getOrCreateClient();
}

// Busca todos os chats do usuário autenticado
export async function getAllChats() {
  const supabase = getOrCreateClient();
  const { data, error } = await supabase.from('chats').select('*');
  if (error) throw error;
  return data;
}

// Busca um chat pelo id (uuid)
export async function getChatById(id: string) {
  const supabase = getOrCreateClient();
  const { data, error } = await supabase.from('chats').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

// Busca um chat pelo url_id
export async function getChatByUrlId(url_id: string) {
  const supabase = getOrCreateClient();
  const { data, error } = await supabase.from('chats').select('*').eq('url_id', url_id).single();
  if (error) throw error;
  return data;
}

// Insere ou atualiza mensagens de um chat
export async function setMessages(
  id: string | undefined,
  messages: Message[],
  url_id: string | null | undefined,
  description?: string,
  timestamp?: string,
): Promise<void> {
  const supabase = getOrCreateClient();
  // Obtem o usuário autenticado via Supabase Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const payload = {
    ...(id ? { id } : {}), // Se existir id, envia para update; caso contrário, deixa o Supabase gerar
    user_id: user.id,
    messages,
    url_id,
    description,
    timestamp: timestamp || new Date().toISOString(),
  };

  const { error } = await supabase.from('chats').upsert(payload);
  if (error) throw error;
}

// Cria um novo chat a partir de um conjunto de messages e um description.
// Retorna o url_id para navegação.
export async function createChatFromMessages(
  description: string,
  messages: Message[],
): Promise<string> {
  const supabase = getOrCreateClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('chats')
    .insert({
      user_id: user.id,
      messages,
      description,
      timestamp: new Date().toISOString(),
    })
    .select();

  if (error) throw error;

  // Se a coluna url_id não foi definida, vamos utilizar o id gerado (uuid) para garantir unicidade
  const chat = data[0];
  const newUrlId = chat.url_id || chat.id;
  if (!chat.url_id) {
    const { error: updateError } = await supabase.from('chats').update({ url_id: newUrlId }).eq('id', chat.id);
    if (updateError) throw updateError;
  }
  return newUrlId;
}

// Atualiza a descrição do chat identificado por id
export async function updateChatDescription(id: string, description: string): Promise<void> {
  const supabase = getOrCreateClient();
  if (!description.trim()) {
    throw new Error('Description cannot be empty');
  }
  const { error } = await supabase.from('chats').update({ description }).eq('id', id);
  if (error) throw error;
}

// Deleta um chat pelo id
export async function deleteById(id: string): Promise<void> {
  const supabase = getOrCreateClient();
  const { error } = await supabase.from('chats').delete().eq('id', id);
  if (error) throw error;
}

// Duplica um chat para criar uma cópia
export async function duplicateChat(id: string): Promise<string> {
  const chat = await getChatById(id);
  if (!chat) throw new Error('Chat not found');
  return createChatFromMessages(chat.description ? `${chat.description} (copy)` : 'Chat (copy)', chat.messages);
}

// Cria um fork de um chat a partir de uma mensagem específica
export async function forkChat(chatId: string, messageId: string): Promise<string> {
  const chat = await getChatById(chatId);
  if (!chat) throw new Error('Chat not found');

  const messageIndex = chat.messages.findIndex((msg: { id: string }) => msg.id === messageId);
  if (messageIndex === -1) throw new Error('Message not found');

  const messages = chat.messages.slice(0, messageIndex + 1);
  return createChatFromMessages(chat.description ? `${chat.description} (fork)` : 'Forked chat', messages);
} 