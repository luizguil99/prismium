-- Criar bucket se não existir
insert into storage.buckets (id, name, public)
select 'components-previews', 'components-previews', true
where not exists (
    select 1 from storage.buckets where id = 'components-previews'
);

-- Remover políticas existentes para evitar conflitos
drop policy if exists "Anyone can upload images" on storage.objects;
drop policy if exists "Anyone can read images" on storage.objects;
drop policy if exists "Anyone can delete images" on storage.objects;

-- Política para upload de imagens
create policy "Anyone can upload images"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'components-previews' 
    and (storage.foldername(name))[1] = 'components'
);

-- Política para leitura de imagens
create policy "Anyone can read images"
on storage.objects for select
to authenticated
using (bucket_id = 'components-previews');

-- Política para deletar imagens
create policy "Anyone can delete images"
on storage.objects for delete
to authenticated
using (
    bucket_id = 'components-previews' 
    and (storage.foldername(name))[1] = 'components'
);

-- Habilitar RLS
alter table storage.objects enable row level security;