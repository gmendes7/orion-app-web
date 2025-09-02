-- Corrigir função handle_ai_chat com search_path
create or replace function public.handle_ai_chat()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- This function will be used by the edge function
  -- Edge functions will handle the OpenAI API calls
  null;
end;
$$;