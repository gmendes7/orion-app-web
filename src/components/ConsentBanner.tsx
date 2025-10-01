import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Eye } from 'lucide-react';
import { PrivacyPolicy } from './PrivacyPolicy';

/**
 * 🍪 Banner de Consentimento LGPD
 * 
 * Solicita consentimento explícito do usuário na primeira visita
 * conforme exigido pela LGPD (Art. 7º, I).
 * 
 * Funcionalidades:
 * - Aparece apenas na primeira visita
 * - Link para política completa
 * - Opções de aceitar ou recusar
 * - Armazena consentimento localmente
 */
export const ConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);

  useEffect(() => {
    // Verifica se já existe consentimento
    const consent = localStorage.getItem('orion_privacy_consent');
    if (!consent) {
      // Aguarda 1 segundo antes de mostrar o banner
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('orion_privacy_consent', JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }));
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('orion_privacy_consent', JSON.stringify({
      accepted: false,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }));
    setShowBanner(false);
  };

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-4 left-4 right-4 z-50 max-w-4xl mx-auto"
          >
            <Card className="p-6 chat-message-orion border-orion-cosmic-blue/30 shadow-2xl">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-orion-stellar-gold/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-orion-stellar-gold" />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-orion-stellar-gold mb-1">
                      🔒 Sua Privacidade é Importante
                    </h3>
                    <p className="text-sm text-orion-space-dust leading-relaxed">
                      Utilizamos cookies essenciais e armazenamos seus dados de forma segura para fornecer
                      nossos serviços. Ao continuar, você concorda com nossa{' '}
                      <button
                        onClick={() => setShowPrivacyDialog(true)}
                        className="text-orion-stellar-gold hover:text-orion-accretion-disk underline transition-colors"
                      >
                        Política de Privacidade
                      </button>
                      {' '}e o tratamento de dados conforme a <strong>LGPD</strong>.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={handleAccept}
                      size="sm"
                      className="bg-gradient-to-r from-orion-cosmic-blue to-orion-stellar-gold hover:opacity-90 text-orion-void"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Aceitar e Continuar
                    </Button>
                    
                    <Button
                      onClick={() => setShowPrivacyDialog(true)}
                      size="sm"
                      variant="outline"
                      className="border-orion-cosmic-blue/30 hover:bg-orion-cosmic-blue/10"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>

                    <Button
                      onClick={handleDecline}
                      size="sm"
                      variant="ghost"
                      className="text-orion-space-dust hover:text-destructive"
                    >
                      Recusar
                    </Button>
                  </div>

                  <p className="text-xs text-orion-space-dust/70">
                    💡 <strong>Seus direitos:</strong> Você pode solicitar acesso, correção ou exclusão
                    dos seus dados a qualquer momento através das configurações.
                  </p>
                </div>

                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDecline}
                  className="flex-shrink-0 text-orion-space-dust hover:text-orion-stellar-gold"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Dialog */}
      <PrivacyPolicy 
        open={showPrivacyDialog} 
        onOpenChange={setShowPrivacyDialog}
        onAccept={handleAccept}
      />
    </>
  );
};
