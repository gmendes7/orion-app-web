-- Adiciona coluna username na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN username TEXT UNIQUE;

-- Cria índice para busca rápida de username
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Atualiza a função handle_new_user para incluir username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, email, full_name, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'username'
  );
  return new;
end;
$function$;

-- Adiciona política RLS para permitir usuários atualizarem seu próprio username
CREATE POLICY "Users can update their own username" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);