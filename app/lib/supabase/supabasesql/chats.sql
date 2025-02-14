-- Remover objetos existentes
drop table if exists public.chats cascade;

-- Create chats table
create table public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  messages jsonb not null default '[]'::jsonb,
  url_id text unique,
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

-- Create indexes
create index chats_user_id_idx on public.chats using btree (user_id);
create index chats_url_id_idx on public.chats using btree (url_id);
create index chats_timestamp_idx on public.chats using btree (timestamp);

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
