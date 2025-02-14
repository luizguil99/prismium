-- Enum para tipos de plano
create type subscription_plan as enum ('free', 'pro', 'enterprise');

-- Enum para status da assinatura
create type subscription_status as enum ('active', 'canceled', 'expired', 'trial');

-- Create a table for public profiles
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  email text unique not null,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  -- Role e permissões
  is_admin boolean default false,
  
  -- Plano e assinatura
  subscription_plan subscription_plan default 'free',
  subscription_status subscription_status default 'trial',
  trial_ends_at timestamptz default (now() + interval '14 days'),
  
  -- Tokens e uso
  total_tokens_used bigint default 0,
  monthly_tokens_used bigint default 0,
  tokens_reset_date timestamptz default (date_trunc('month', now()) + interval '1 month'),
  tokens_limit bigint default 100000, -- Limite baseado no plano
  
  -- Preferências
  theme text default 'dark',
  
  -- Métricas de uso
  last_login_at timestamptz,
  login_count integer default 0
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone." 
  on public.profiles for select 
  using ( true );

create policy "Users can insert their own profile." 
  on public.profiles for insert 
  with check ( auth.uid() = id );

create policy "Users can update their own profile." 
  on public.profiles for update 
  using ( auth.uid() = id );

create policy "Admins can update any profile."
  on public.profiles for update
  using ( 
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Create function to handle new user creation
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (
    id, 
    email, 
    name,
    subscription_plan,
    subscription_status,
    trial_ends_at
  )
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'name',
    'free',
    'trial',
    now() + interval '14 days'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create indexes
create index profiles_email_idx on public.profiles using btree (email);
create index profiles_subscription_plan_idx on public.profiles using btree (subscription_plan);

-- Set up realtime
alter publication supabase_realtime add table public.profiles;
