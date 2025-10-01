import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Eye, Trash2, FileText, CheckCircle } from "lucide-react";

interface PrivacyPolicyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
}

/**
 * 🔒 Componente de Política de Privacidade e LGPD
 * 
 * Apresenta de forma clara e transparente:
 * - Coleta e uso de dados pessoais
 * - Direitos do titular (LGPD)
 * - Segurança e armazenamento
 * - Consentimento explícito
 */
export const PrivacyPolicy = ({ open, onOpenChange, onAccept }: PrivacyPolicyProps) => {
  const handleAccept = () => {
    // Salva consentimento no localStorage
    localStorage.setItem('orion_privacy_consent', JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }));
    
    onAccept?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] chat-message-orion border-orion-cosmic-blue/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-orion-stellar-gold">
            <Shield className="w-6 h-6" />
            Política de Privacidade e LGPD
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm text-foreground">
            
            {/* Introdução */}
            <section>
              <h3 className="text-lg font-semibold text-orion-stellar-gold mb-2">
                📋 Sobre Esta Política
              </h3>
              <p className="text-orion-space-dust leading-relaxed">
                O.R.I.Ö.N respeita sua privacidade e está comprometido com a proteção de seus dados pessoais
                em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong>.
                Esta política explica como coletamos, usamos e protegemos suas informações.
              </p>
            </section>

            {/* Dados Coletados */}
            <section>
              <h3 className="text-lg font-semibold text-orion-stellar-gold mb-2 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Dados Coletados
              </h3>
              <div className="space-y-2 text-orion-space-dust">
                <p><strong>Dados de Cadastro:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Nome completo</li>
                  <li>Endereço de e-mail</li>
                  <li>Senha (armazenada de forma criptografada)</li>
                </ul>
                
                <p className="mt-3"><strong>Dados de Uso:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Histórico de conversas com a IA</li>
                  <li>Documentos e imagens enviados para análise</li>
                  <li>Preferências e configurações da conta</li>
                  <li>Logs de acesso e atividade (para segurança)</li>
                </ul>
              </div>
            </section>

            {/* Finalidade */}
            <section>
              <h3 className="text-lg font-semibold text-orion-stellar-gold mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Finalidade do Uso
              </h3>
              <p className="text-orion-space-dust leading-relaxed">
                Seus dados são utilizados exclusivamente para:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-orion-space-dust mt-2">
                <li>Autenticação e gerenciamento de conta</li>
                <li>Fornecimento dos serviços de IA</li>
                <li>Melhoria da experiência do usuário</li>
                <li>Comunicação sobre atualizações do serviço</li>
                <li>Segurança e prevenção de fraudes</li>
              </ul>
              <p className="text-orion-space-dust leading-relaxed mt-2">
                <strong>Não compartilhamos, vendemos ou alugamos seus dados a terceiros.</strong>
              </p>
            </section>

            {/* Segurança */}
            <section>
              <h3 className="text-lg font-semibold text-orion-stellar-gold mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Segurança e Armazenamento
              </h3>
              <div className="space-y-2 text-orion-space-dust">
                <p><strong>Medidas de Segurança:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Criptografia de dados sensíveis (senhas, tokens)</li>
                  <li>Comunicação via HTTPS (SSL/TLS)</li>
                  <li>Row Level Security (RLS) no banco de dados</li>
                  <li>Autenticação multi-fator disponível</li>
                  <li>Backups regulares e seguros</li>
                </ul>
                
                <p className="mt-3"><strong>Armazenamento:</strong></p>
                <p>
                  Seus dados são armazenados em servidores seguros fornecidos pela Supabase,
                  com data centers localizados em regiões com conformidade LGPD.
                </p>
              </div>
            </section>

            {/* Direitos do Titular */}
            <section>
              <h3 className="text-lg font-semibold text-orion-stellar-gold mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Seus Direitos (LGPD)
              </h3>
              <p className="text-orion-space-dust leading-relaxed">
                De acordo com a LGPD, você tem os seguintes direitos:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-orion-space-dust mt-2">
                <li><strong>Confirmação e acesso:</strong> Saber se processamos seus dados e acessá-los</li>
                <li><strong>Correção:</strong> Corrigir dados incompletos ou incorretos</li>
                <li><strong>Anonimização ou exclusão:</strong> Solicitar a remoção de seus dados</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                <li><strong>Revogação do consentimento:</strong> Retirar seu consentimento a qualquer momento</li>
                <li><strong>Oposição:</strong> Opor-se ao tratamento de seus dados</li>
              </ul>
            </section>

            {/* Como Exercer Direitos */}
            <section>
              <h3 className="text-lg font-semibold text-orion-stellar-gold mb-2 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Como Exercer Seus Direitos
              </h3>
              <div className="space-y-2 text-orion-space-dust">
                <p>Para exercer qualquer um de seus direitos, você pode:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Acessar suas configurações de conta</strong> para visualizar e editar dados</li>
                  <li><strong>Excluir sua conta</strong> através das configurações (remoção permanente de dados)</li>
                  <li><strong>Entrar em contato conosco</strong> via e-mail do desenvolvedor</li>
                </ul>
                
                <p className="mt-3">
                  <strong>Tempo de resposta:</strong> Responderemos sua solicitação em até 15 dias úteis.
                </p>
              </div>
            </section>

            {/* Cookies e Tecnologias */}
            <section>
              <h3 className="text-lg font-semibold text-orion-stellar-gold mb-2">
                🍪 Cookies e Tecnologias Similares
              </h3>
              <p className="text-orion-space-dust leading-relaxed">
                Utilizamos cookies essenciais para:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-orion-space-dust mt-2">
                <li>Manter sua sessão ativa e autenticada</li>
                <li>Salvar preferências (tema, idioma)</li>
                <li>Melhorar a performance do aplicativo</li>
              </ul>
              <p className="text-orion-space-dust leading-relaxed mt-2">
                Você pode gerenciar cookies através das configurações do seu navegador.
              </p>
            </section>

            {/* Retenção de Dados */}
            <section>
              <h3 className="text-lg font-semibold text-orion-stellar-gold mb-2">
                ⏰ Retenção de Dados
              </h3>
              <p className="text-orion-space-dust leading-relaxed">
                Mantemos seus dados pessoais apenas pelo tempo necessário para as finalidades descritas,
                ou conforme exigido por lei. Ao excluir sua conta, seus dados serão permanentemente removidos
                em até 30 dias, exceto quando houver obrigação legal de retenção.
              </p>
            </section>

            {/* Alterações */}
            <section>
              <h3 className="text-lg font-semibold text-orion-stellar-gold mb-2">
                📝 Alterações na Política
              </h3>
              <p className="text-orion-space-dust leading-relaxed">
                Esta política pode ser atualizada periodicamente. Notificaremos sobre alterações significativas
                via e-mail ou através de aviso no aplicativo. A versão mais recente sempre estará disponível
                nas configurações.
              </p>
            </section>

            {/* Contato */}
            <section className="border-t border-orion-cosmic-blue/20 pt-4">
              <h3 className="text-lg font-semibold text-orion-stellar-gold mb-2">
                📧 Contato
              </h3>
              <p className="text-orion-space-dust leading-relaxed">
                Para dúvidas ou solicitações relacionadas a esta política:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-orion-space-dust mt-2">
                <li><strong>Desenvolvedor:</strong> Gabriel Mendes</li>
                <li><strong>E-mail:</strong> [seu-email@exemplo.com]</li>
              </ul>
            </section>

            {/* Footer */}
            <section className="text-center pt-4 border-t border-orion-cosmic-blue/20">
              <p className="text-xs text-orion-space-dust">
                <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
                <br />
                <strong>Versão:</strong> 1.0
              </p>
            </section>

          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-orion-cosmic-blue/20">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 border-orion-cosmic-blue/30 hover:bg-orion-cosmic-blue/10"
          >
            Fechar
          </Button>
          {onAccept && (
            <Button
              onClick={handleAccept}
              className="flex-1 bg-gradient-to-r from-orion-cosmic-blue to-orion-stellar-gold hover:opacity-90"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Aceito os Termos
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
