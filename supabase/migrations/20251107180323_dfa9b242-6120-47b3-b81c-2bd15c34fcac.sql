-- ========================================
-- 🔐 ORION SECURITY SYSTEM - FASE 2 (Incremental)
-- Adicionar roles, rate limiting e funções de segurança
-- ========================================

-- 1️⃣ Criar ENUM para roles (admin/user/premium) se não existir
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'premium');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2️⃣ Atualizar tabela profiles existente (adicionar campos se necessário)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3️⃣ Tabela de roles (SEPARADA - segurança crítica)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 4️⃣ Tabela de rate limiting
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5️⃣ Habilitar RLS em novas tabelas
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- 6️⃣ Security Definer Function para verificar roles (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 7️⃣ Atualizar função de novo usuário para incluir role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar ou atualizar perfil
  INSERT INTO public.profiles (id, email, full_name, username, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    username = COALESCE(EXCLUDED.username, public.profiles.username),
    updated_at = NOW();
  
  -- Atribuir role 'user' por padrão (se não existir)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 8️⃣ RLS Policies - User Roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 9️⃣ RLS Policy adicional para Profiles - Admins veem tudo
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 🔟 RLS Policies - API Rate Limits
DROP POLICY IF EXISTS "Only service role can insert rate limits" ON public.api_rate_limits;
CREATE POLICY "Only service role can insert rate limits"
  ON public.api_rate_limits FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "Admins can view rate limits" ON public.api_rate_limits;
CREATE POLICY "Admins can view rate limits"
  ON public.api_rate_limits FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view own rate limits" ON public.api_rate_limits;
CREATE POLICY "Users can view own rate limits"
  ON public.api_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

-- 1️⃣1️⃣ Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_user_id ON public.api_rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_ip_endpoint ON public.api_rate_limits(ip_address, endpoint);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window ON public.api_rate_limits(window_start);

-- 1️⃣2️⃣ Comentários para documentação
COMMENT ON TABLE public.user_roles IS 'Roles de usuário (admin/user/premium) - NUNCA armazenar em profiles!';
COMMENT ON TABLE public.api_rate_limits IS 'Rate limiting para proteção contra DDoS';
COMMENT ON FUNCTION public.has_role IS 'Security definer function para verificar roles sem recursão RLS';