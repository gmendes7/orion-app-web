-- Criar tabela de perfis de usuário
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  primary key (id)
);

-- Habilitar RLS na tabela profiles
alter table public.profiles enable row level security;

-- Política para usuários verem apenas seu próprio perfil
create policy "Users can view their own profile" 
on public.profiles 
for select 
using (auth.uid() = id);

-- Política para usuários atualizarem seu próprio perfil
create policy "Users can update their own profile" 
on public.profiles 
for update 
using (auth.uid() = id);

-- Política para inserir perfil na criação do usuário
create policy "Users can insert their own profile" 
on public.profiles 
for insert 
with check (auth.uid() = id);

-- Criar tabela de conversas
create table public.conversations (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  title text not null default 'Nova Conversa',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Habilitar RLS na tabela conversations
alter table public.conversations enable row level security;

-- Políticas para conversations
create policy "Users can view their own conversations" 
on public.conversations 
for select 
using (auth.uid() = user_id);

create policy "Users can create their own conversations" 
on public.conversations 
for insert 
with check (auth.uid() = user_id);

create policy "Users can update their own conversations" 
on public.conversations 
for update 
using (auth.uid() = user_id);

create policy "Users can delete their own conversations" 
on public.conversations 
for delete 
using (auth.uid() = user_id);

-- Criar tabela de mensagens
create table public.messages (
  id uuid not null default gen_random_uuid() primary key,
  conversation_id uuid not null references public.conversations on delete cascade,
  content text not null,
  is_user boolean not null default true,
  created_at timestamp with time zone not null default now()
);

-- Habilitar RLS na tabela messages
alter table public.messages enable row level security;

-- Políticas para messages (usuário pode ver mensagens de suas conversas)
create policy "Users can view messages of their conversations" 
on public.messages 
for select 
using (
  conversation_id in (
    select id from public.conversations where user_id = auth.uid()
  )
);

create policy "Users can create messages in their conversations" 
on public.messages 
for insert 
with check (
  conversation_id in (
    select id from public.conversations where user_id = auth.uid()
  )
);

-- Função para criar perfil automaticamente quando usuário se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

-- Trigger para criar perfil automaticamente
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Função para atualizar updated_at automaticamente
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers para atualizar updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

create trigger update_conversations_updated_at
  before update on public.conversations
  for each row execute procedure public.update_updated_at_column();