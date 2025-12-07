-- ===========================================
-- ORION ADVANCED AI SYSTEM - Database Schema V2
-- Ignoring existing types and tables
-- ===========================================

-- 1. User Roles Table (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
        CREATE TABLE public.user_roles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            role public.app_role NOT NULL DEFAULT 'user',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            UNIQUE (user_id, role)
        );
        ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create has_role function (OR REPLACE handles existing)
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

-- RLS policies for user_roles (drop if exists first)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Add missing columns to profiles if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferences') THEN
        ALTER TABLE public.profiles ADD COLUMN preferences JSONB DEFAULT '{}';
    END IF;
END $$;

-- 3. Update handle_new_user function to include role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'username', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    updated_at = now();
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Add missing columns to conversations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'metadata') THEN
        ALTER TABLE public.conversations ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'is_archived') THEN
        ALTER TABLE public.conversations ADD COLUMN is_archived BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 5. Add missing columns to messages
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'metadata') THEN
        ALTER TABLE public.messages ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'tokens_used') THEN
        ALTER TABLE public.messages ADD COLUMN tokens_used INTEGER;
    END IF;
END $$;

-- 6. AI Agents Table
CREATE TABLE IF NOT EXISTS public.ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('support', 'automation', 'task', 'analysis', 'custom')),
    system_prompt TEXT NOT NULL,
    model TEXT DEFAULT 'google/gemini-2.5-flash',
    temperature NUMERIC(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2048,
    tools JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public agents are viewable by everyone" ON public.ai_agents;
CREATE POLICY "Public agents are viewable by everyone"
ON public.ai_agents FOR SELECT
USING (is_public = true OR created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create agents" ON public.ai_agents;
CREATE POLICY "Users can create agents"
ON public.ai_agents FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update own agents" ON public.ai_agents;
CREATE POLICY "Users can update own agents"
ON public.ai_agents FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can delete own agents" ON public.ai_agents;
CREATE POLICY "Users can delete own agents"
ON public.ai_agents FOR DELETE
TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 7. Automation Tasks Table
CREATE TABLE IF NOT EXISTS public.automation_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    agent_id UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('schedule', 'event', 'webhook', 'manual')),
    trigger_config JSONB DEFAULT '{}',
    action_type TEXT NOT NULL CHECK (action_type IN ('message', 'api_call', 'email', 'notification', 'custom')),
    action_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.automation_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own automation tasks" ON public.automation_tasks;
CREATE POLICY "Users can view own automation tasks"
ON public.automation_tasks FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create automation tasks" ON public.automation_tasks;
CREATE POLICY "Users can create automation tasks"
ON public.automation_tasks FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own automation tasks" ON public.automation_tasks;
CREATE POLICY "Users can update own automation tasks"
ON public.automation_tasks FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own automation tasks" ON public.automation_tasks;
CREATE POLICY "Users can delete own automation tasks"
ON public.automation_tasks FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 8. Task Execution Logs
CREATE TABLE IF NOT EXISTS public.task_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.automation_tasks(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failed', 'cancelled')),
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.task_execution_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own task logs" ON public.task_execution_logs;
CREATE POLICY "Users can view own task logs"
ON public.task_execution_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.automation_tasks 
        WHERE id = task_execution_logs.task_id 
        AND user_id = auth.uid()
    )
);

-- 9. Knowledge Base
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source_type TEXT CHECK (source_type IN ('document', 'url', 'manual', 'api')),
    source_url TEXT,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own or public knowledge" ON public.knowledge_base;
CREATE POLICY "Users can view own or public knowledge"
ON public.knowledge_base FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_public = true);

DROP POLICY IF EXISTS "Users can create knowledge" ON public.knowledge_base;
CREATE POLICY "Users can create knowledge"
ON public.knowledge_base FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own knowledge" ON public.knowledge_base;
CREATE POLICY "Users can update own knowledge"
ON public.knowledge_base FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own knowledge" ON public.knowledge_base;
CREATE POLICY "Users can delete own knowledge"
ON public.knowledge_base FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 10. Search knowledge base function
CREATE OR REPLACE FUNCTION public.search_knowledge_base(
    query_embedding vector(1536),
    user_id_param UUID,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    source_type TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kb.id,
        kb.title,
        kb.content,
        kb.source_type,
        (1 - (kb.embedding <=> query_embedding))::FLOAT as similarity
    FROM public.knowledge_base kb
    WHERE (kb.user_id = user_id_param OR kb.is_public = true)
        AND kb.embedding IS NOT NULL
        AND (1 - (kb.embedding <=> query_embedding)) > match_threshold
    ORDER BY kb.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 11. Performance indexes
CREATE INDEX IF NOT EXISTS idx_ai_agents_type ON public.ai_agents(type);
CREATE INDEX IF NOT EXISTS idx_ai_agents_is_public ON public.ai_agents(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_automation_tasks_user_id ON public.automation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_tasks_next_run ON public.automation_tasks(next_run_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_knowledge_base_user_id ON public.knowledge_base(user_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON public.task_execution_logs(task_id);

-- 12. Updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_agents_updated_at ON public.ai_agents;
CREATE TRIGGER update_ai_agents_updated_at
    BEFORE UPDATE ON public.ai_agents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_automation_tasks_updated_at ON public.automation_tasks;
CREATE TRIGGER update_automation_tasks_updated_at
    BEFORE UPDATE ON public.automation_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_base_updated_at ON public.knowledge_base;
CREATE TRIGGER update_knowledge_base_updated_at
    BEFORE UPDATE ON public.knowledge_base
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Insert default AI agents (only if table is empty)
INSERT INTO public.ai_agents (name, description, type, system_prompt, is_public, is_active)
SELECT * FROM (VALUES 
    (
        'Orion Support',
        'Agente especializado em suporte ao usuário e ajuda com o sistema',
        'support',
        'Você é o Orion Support, um agente de IA especializado em ajudar usuários com dúvidas sobre o sistema ORION. Seja sempre amigável, claro e prestativo. Explique funcionalidades, resolva problemas e guie os usuários.',
        true,
        true
    ),
    (
        'Orion Analyzer',
        'Agente analítico para processamento de dados e insights',
        'analysis',
        'Você é o Orion Analyzer, especializado em análise de dados e geração de insights. Processe informações de forma estruturada, identifique padrões e forneça recomendações baseadas em dados.',
        true,
        true
    ),
    (
        'Orion Task Master',
        'Agente para automação e gerenciamento de tarefas',
        'task',
        'Você é o Orion Task Master, especializado em ajudar usuários a organizar, planejar e automatizar tarefas. Crie listas, defina prioridades e sugira automações.',
        true,
        true
    )
) AS v(name, description, type, system_prompt, is_public, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.ai_agents LIMIT 1);