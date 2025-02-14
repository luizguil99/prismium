-- Remover objetos existentes
drop table if exists public.chat_messages cascade;

-- Create chat_messages table
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now() not null,
  metadata jsonb default '{}'::jsonb
);

-- Set up Row Level Security (RLS)
alter table public.chat_messages enable row level security;

-- Create policies
create policy "Users can view messages from their chats." 
  on public.chat_messages for select 
  using (
    exists (
      select 1 from public.chats
      where chats.id = chat_messages.chat_id
      and chats.user_id = auth.uid()
    )
  );

create policy "Users can create messages in their chats." 
  on public.chat_messages for insert 
  with check (
    exists (
      select 1 from public.chats
      where chats.id = chat_messages.chat_id
      and chats.user_id = auth.uid()
    )
  );

create policy "Users can update messages in their chats." 
  on public.chat_messages for update 
  using (
    exists (
      select 1 from public.chats
      where chats.id = chat_messages.chat_id
      and chats.user_id = auth.uid()
    )
  );

create policy "Users can delete messages from their chats." 
  on public.chat_messages for delete 
  using (
    exists (
      select 1 from public.chats
      where chats.id = chat_messages.chat_id
      and chats.user_id = auth.uid()
    )
  );

-- Create indexes
create index chat_messages_chat_id_idx on public.chat_messages using btree (chat_id);
create index chat_messages_created_at_idx on public.chat_messages using btree (created_at);

-- Set up realtime
alter publication supabase_realtime add table public.chat_messages;
