import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Zap } from 'lucide-react';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Verificar se é iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIos(isIosDevice);

    // Verificar se já está instalado (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);

    // Se já estiver instalado, não mostrar o banner
    if (isStandalone) {
      setShowBanner(false);
      return;
    }

    // Verificar se o usuário já fechou o banner antes
    const hasDismissed = localStorage.getItem('install_banner_dismissed') === 'true';
    if (hasDismissed) {
      setShowBanner(false);
      return;
    }

    // iOS - mostrar sempre
    if (isIosDevice) {
      setShowBanner(true);
      return;
    }

    // Android/Chrome - usar o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listener para quando o app foi instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Fallback: mostrar após 2 segundos se não houver evento
    const fallbackTimer = setTimeout(() => {
      if (!isIosDevice && !deferredPrompt && !isStandalone) {
        setShowBanner(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstall = async () => {
    // iOS - mostrar instruções
    if (isIos) {
      alert('📱 Para instalar o app no seu iPhone/iPad:\n\n1. Toque no ícone de Compartilhar (⬆️)\n2. Role para baixo e selecione "Adicionar à Tela de Início"\n3. Confirme tocando em "Adicionar"');
      return;
    }

    // Android/Chrome - usar o prompt
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome === 'accepted') {
          console.log('✅ App instalado com sucesso!');
          setIsInstalled(true);
          setShowBanner(false);
        } else {
          console.log('❌ Instalação cancelada');
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Erro ao instalar:', error);
      }
    } else {
      // Fallback - abrir instruções
      alert('📱 Para instalar o app:\n\n1. Abra o Chrome no celular\n2. Toque nos 3 pontinhos (menu)\n3. Selecione "Instalar aplicativo"');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    localStorage.setItem('install_banner_dismissed', 'true');
  };

  // Se já estiver instalado ou não mostrar, não renderiza nada
  if (!showBanner || isInstalled || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-2xl animate-slide-up">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* Conteúdo do Banner */}
          <div className="flex-1 flex items-center gap-3 sm:gap-4">
            {/* Ícone */}
            <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm">
              <Zap className="w-7 h-7 text-white" />
            </div>
            
            {/* Texto */}
            <div className="flex-1">
              <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                <span>📱 Instale o aplicativo no tablet ou celular</span>
              </h3>
              <p className="text-indigo-100 text-xs sm:text-sm">
                Use o botão abaixo para adicionar o C4 Gestão à tela inicial e acessar rapidamente offline.
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleInstall}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-white text-indigo-700 font-bold rounded-xl shadow-lg hover:bg-indigo-50 transition-all transform hover:scale-105 active:scale-95 text-sm"
              id="btn-install-banner"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>INSTALAR APP</span>
            </button>
            
            <button
              onClick={handleDismiss}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}