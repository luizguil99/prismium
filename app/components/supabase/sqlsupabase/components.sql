-- Create a table for components with category organization and Supabase storage support
create table components (
    id uuid default gen_random_uuid() primary key,
    name varchar(255) not null,
    description text,
    preview_url text, -- URL from Supabase Storage
    is_new boolean default false,
    prompt text not null,
    category varchar(100) not null,
    subcategory varchar(100) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create an index for faster category and subcategory queries
create index idx_components_category_subcategory on components(category, subcategory);

-- Enable Row Level Security (RLS)
alter table components enable row level security;

-- Create a policy that allows all authenticated users to read components
create policy "Anyone can read components"
on components for select
to authenticated
using (true);

-- Create a policy that allows only admins to modify components
create policy "Only admins can modify components"
on components for all
to authenticated
using (
    exists (
        select 1 
        from profiles 
        where profiles.id = auth.uid() 
        and profiles.is_admin = true
    )
)
with check (
    exists (
        select 1 
        from profiles 
        where profiles.id = auth.uid() 
        and profiles.is_admin = true
    )
);

-- Function to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Trigger to call the update function
create trigger update_components_updated_at
    before update on components
    for each row
    execute function update_updated_at_column();
