-- Enable pgvector extension
create extension if not exists vector;

-- Documents table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS for documents
alter table public.documents enable row level security;

-- Policies for documents
create policy if not exists "Users can view their own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert their own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update their own documents"
  on public.documents for update
  using (auth.uid() = user_id);

create policy if not exists "Users can delete their own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

-- Trigger to update updated_at
create trigger if not exists update_documents_updated_at
  before update on public.documents
  for each row execute function public.update_updated_at_column();

-- Document chunks table (with pgvector)
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

-- RLS for document_chunks
alter table public.document_chunks enable row level security;

create policy if not exists "Users can view chunks of their documents"
  on public.document_chunks for select
  using (document_id in (select id from public.documents where user_id = auth.uid()));

create policy if not exists "Users can insert chunks into their documents"
  on public.document_chunks for insert
  with check (document_id in (select id from public.documents where user_id = auth.uid()));

create policy if not exists "Users can update chunks of their documents"
  on public.document_chunks for update
  using (document_id in (select id from public.documents where user_id = auth.uid()));

create policy if not exists "Users can delete chunks of their documents"
  on public.document_chunks for delete
  using (document_id in (select id from public.documents where user_id = auth.uid()));

-- Indexes
create index if not exists document_chunks_document_id_idx on public.document_chunks(document_id);
create index if not exists document_chunks_embedding_idx on public.document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
