-- Tabela para versionamento de prompts dos agentes
CREATE TABLE public.agent_prompt_versions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    system_prompt TEXT NOT NULL,
    change_description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN DEFAULT false
);

-- Índice para busca rápida por agente
CREATE INDEX idx_agent_prompt_versions_agent_id ON public.agent_prompt_versions(agent_id);
CREATE INDEX idx_agent_prompt_versions_active ON public.agent_prompt_versions(agent_id, is_active) WHERE is_active = true;

-- RLS para agent_prompt_versions
ALTER TABLE public.agent_prompt_versions ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver versões dos agentes que podem acessar
CREATE POLICY "Users can view prompt versions of accessible agents"
ON public.agent_prompt_versions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.ai_agents
        WHERE ai_agents.id = agent_prompt_versions.agent_id
        AND (ai_agents.is_public = true OR ai_agents.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
);

-- Usuários podem criar versões dos próprios agentes
CREATE POLICY "Users can create prompt versions for own agents"
ON public.agent_prompt_versions
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.ai_agents
        WHERE ai_agents.id = agent_prompt_versions.agent_id
        AND (ai_agents.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
);

-- Usuários podem atualizar versões dos próprios agentes
CREATE POLICY "Users can update prompt versions for own agents"
ON public.agent_prompt_versions
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.ai_agents
        WHERE ai_agents.id = agent_prompt_versions.agent_id
        AND (ai_agents.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
);

-- Usuários podem deletar versões dos próprios agentes
CREATE POLICY "Users can delete prompt versions for own agents"
ON public.agent_prompt_versions
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.ai_agents
        WHERE ai_agents.id = agent_prompt_versions.agent_id
        AND (ai_agents.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
);

-- Função para criar uma nova versão do prompt automaticamente
CREATE OR REPLACE FUNCTION public.create_prompt_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o prompt mudou, cria uma nova versão
    IF OLD.system_prompt IS DISTINCT FROM NEW.system_prompt THEN
        INSERT INTO public.agent_prompt_versions (
            agent_id,
            version_number,
            system_prompt,
            change_description,
            created_by,
            is_active
        )
        SELECT 
            NEW.id,
            COALESCE((SELECT MAX(version_number) + 1 FROM public.agent_prompt_versions WHERE agent_id = NEW.id), 1),
            NEW.system_prompt,
            'Atualização automática',
            auth.uid(),
            true;
        
        -- Desativa versões anteriores
        UPDATE public.agent_prompt_versions 
        SET is_active = false 
        WHERE agent_id = NEW.id 
        AND id != (SELECT id FROM public.agent_prompt_versions WHERE agent_id = NEW.id ORDER BY created_at DESC LIMIT 1);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para versionamento automático
CREATE TRIGGER trigger_create_prompt_version
AFTER UPDATE ON public.ai_agents
FOR EACH ROW
EXECUTE FUNCTION public.create_prompt_version();

-- Função para criar primeira versão ao criar agente
CREATE OR REPLACE FUNCTION public.create_initial_prompt_version()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.agent_prompt_versions (
        agent_id,
        version_number,
        system_prompt,
        change_description,
        created_by,
        is_active
    ) VALUES (
        NEW.id,
        1,
        NEW.system_prompt,
        'Versão inicial',
        NEW.created_by,
        true
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar versão inicial
CREATE TRIGGER trigger_create_initial_prompt_version
AFTER INSERT ON public.ai_agents
FOR EACH ROW
EXECUTE FUNCTION public.create_initial_prompt_version();