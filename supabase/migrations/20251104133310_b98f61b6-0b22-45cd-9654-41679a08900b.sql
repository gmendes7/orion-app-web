-- Adicionar políticas RLS para proteger logs de auditoria da tabela api_usage
-- Apenas edge functions (service role) podem inserir dados
-- Usuários não podem modificar ou deletar logs para manter integridade do audit trail

-- Política INSERT: Bloqueia inserções de usuários autenticados
-- Edge functions usam service_role que bypassa RLS
CREATE POLICY "Only service role can insert API usage logs"
ON public.api_usage
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Política UPDATE: Bloqueia completamente atualizações
CREATE POLICY "API usage logs cannot be updated"
ON public.api_usage
FOR UPDATE
TO authenticated
USING (false);

-- Política DELETE: Bloqueia completamente deleções
CREATE POLICY "API usage logs cannot be deleted"
ON public.api_usage
FOR DELETE
TO authenticated
USING (false);