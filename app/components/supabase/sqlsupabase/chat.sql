-- Remover objetos existentes
drop table if exists public.chats cascade;

-- Create chats table
create table public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  messages jsonb not null default '[]'::jsonb,
  urlId text,
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


-- Create function to update updated_at on chat update
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for updated_at
create trigger on_chat_updated
  before update on public.chats
  for each row execute procedure public.handle_updated_at();

-- Set up realtime
alter publication supabase_realtime add table public.chats;
ALTER TABLE public.chats ADD COLUMN metadata JSONB DEFAULT NULL;

-- Adicionar índice para otimizar consultas na coluna metadata
CREATE INDEX chats_metadata_idx ON public.chats USING GIN (metadata);

-- Comentário explicativo
COMMENT ON COLUMN public.chats.metadata IS 'Armazena metadados adicionais do chat em formato JSON';

-- Comentário explicativo
COMMENT ON COLUMN public.chats.metadata IS 'Armazena metadados adicionais do chat em formato JSON';
ALTER TABLE public.chats RENAME COLUMN urlid TO "urlId";