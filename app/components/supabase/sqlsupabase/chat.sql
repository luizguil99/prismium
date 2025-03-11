-- Remover objetos existentes
drop table if exists public.chats cascade;

-- Create chats table
create table public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  messages jsonb not null default '[]'::jsonb,
  urlid text, -- Nome padronizado em minúsculas para evitar problemas com case-sensitivity
  description text,
  timestamp timestamptz default now() not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Set up Row Level Security (RLS)
alter table public.chats enable row level security;

-- Create policies
create policy "Users can view their own chats." 
  on public.chats for select 
  using ( auth.uid() = user_id );

create policy "Users can create their own chats." 
  on public.chats for insert 
  with check ( auth.uid() = user_id );

create policy "Users can update their own chats." 
  on public.chats for update 
  using ( auth.uid() = user_id );

create policy "Users can delete their own chats." 
  on public.chats for delete 
  using ( auth.uid() = user_id );


