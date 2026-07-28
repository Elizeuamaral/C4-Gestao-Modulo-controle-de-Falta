import React, { useState, useEffect } from 'react';
import { Download, X, Zap } from 'lucide-react';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);

    if (isStandalone) {
      setShowBanner(false);
      return;
    }

    // Verificar se o usuário já fechou
    const hasDismissed = localStorage.getItem('install_banner_dismissed') === 'true';
    if (hasDismissed) {
      setShowBanner(false);
      return;
    }

    // iOS
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIos) {
      setShowBanner(true);
      return;
    }

    // Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Fallback
    const timer = setTimeout(() => {
      if (!deferredPrompt && !isStandalone) {
        setShowBanner(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    // iOS
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      alert('📱 Para instalar o app no seu iPhone/iPad:\n\n1. Toque no ícone de Compartilhar (⬆️)\n2. Role para baixo e selecione "Adicionar à Tela de Início"\n3. Confirme tocando em "Adicionar"');
      return;
    }

    // Android/Chrome
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome === 'accepted') {
          setIsInstalled(true);
          setShowBanner(false);
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Erro ao instalar:', error);
      }
    } else {
      // Fallback
      const isChrome = /Chrome/.test(navigator.userAgent);
      if (isChrome) {
        alert('📱 Para instalar o app:\n\n1. Abra o Chrome\n2. Toque nos 3 pontinhos (menu)\n3. Selecione "Instalar aplicativo"');
      } else {
        alert('📱 Para instalar o app, use o navegador Chrome no celular.');
      }
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('install_banner_dismissed', 'true');
  };

  if (!showBanner || isInstalled) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-t border-indigo-500/30 shadow-2xl">
      <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          
          {/* Texto */}
          <div className="flex-1 flex items-center gap-3">
            <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-indigo-500/20 rounded-full shrink-0">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                <span className="text-indigo-400 text-base sm:text-lg">📱</span>
                Instale o aplicativo no tablet ou celular
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm">
                Use o botão abaixo para adicionar o C4 Gestão à tela inicial e acessar rapidamente offline.
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleInstall}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-105 active:scale-95 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>INSTALAR APP</span>
            </button>
            
            <button
              onClick={handleDismiss}
              className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}