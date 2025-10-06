-- Criar enum para planos
CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro', 'enterprise');

-- Criar enum para status de API key
CREATE TYPE public.api_key_status AS ENUM ('active', 'revoked', 'expired');

-- Tabela de planos de assinatura
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier public.subscription_tier NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_requests_per_month INTEGER NOT NULL,
  max_requests_per_minute INTEGER NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de assinaturas de usuários
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier public.subscription_tier NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabela de API Keys
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default Key',
  status public.api_key_status NOT NULL DEFAULT 'active',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  CONSTRAINT valid_expiry CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Tabela de uso da API (para tracking e analytics)
CREATE TABLE public.api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  request_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_status INTEGER,
  error_message TEXT
);

-- Criar índices para performance
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_status ON public.api_keys(status);
CREATE INDEX idx_api_usage_user_id ON public.api_usage(user_id);
CREATE INDEX idx_api_usage_request_time ON public.api_usage(request_time);
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

-- Habilitar RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para subscription_plans (público para leitura)
CREATE POLICY "Anyone can view subscription plans"
  ON public.subscription_plans
  FOR SELECT
  USING (true);

-- Políticas RLS para user_subscriptions
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON public.user_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.user_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas RLS para api_keys
CREATE POLICY "Users can view their own API keys"
  ON public.api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys"
  ON public.api_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON public.api_keys
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON public.api_keys
  FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para api_usage
CREATE POLICY "Users can view their own API usage"
  ON public.api_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_updated_at();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_updated_at();

-- Inserir planos padrão
INSERT INTO public.subscription_plans (tier, name, price_monthly, max_requests_per_month, max_requests_per_minute, features) VALUES
('free', 'Free Plan', 0, 1000, 10, '["1,000 requests/month", "10 requests/minute", "Community support", "Basic chat assistant"]'::jsonb),
('pro', 'Pro Plan', 29.99, 50000, 100, '["50,000 requests/month", "100 requests/minute", "Priority support", "Advanced AI features", "Custom training", "API access"]'::jsonb),
('enterprise', 'Enterprise Plan', 299.99, 1000000, 1000, '["1,000,000 requests/month", "1,000 requests/minute", "Dedicated support", "Custom AI models", "Advanced analytics", "SLA guarantee", "White-label option"]'::jsonb);

-- Função para criar assinatura free automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.create_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar assinatura free ao registrar usuário
CREATE TRIGGER on_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_subscription();