import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle } from 'lucide-react';

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    // Verificar se é iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIos(isIosDevice);

    // Verificar se já está instalado (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);

    // Se já estiver instalado, não mostrar o botão
    if (isStandalone) {
      setShowInstall(false);
      return;
    }

    // Verificar se é iOS (usa o prompt nativo)
    if (isIosDevice) {
      setShowInstall(true);
      return;
    }

    // Listener para o evento beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listener para quando o app foi instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Verificar se o app já está instalado
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (isStandalone) {
        setIsInstalled(true);
        setShowInstall(false);
      }
    };

    checkInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
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
          setShowInstall(false);
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

  // Se já estiver instalado ou não mostrar, não renderiza nada
  if (!showInstall || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all transform hover:scale-105 active:scale-95"
        id="btn-install-app"
      >
        {isIos ? (
          <Smartphone className="w-5 h-5" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        <span className="text-sm">
          {isIos ? 'Adicionar à Tela de Início' : 'Instalar App'}
        </span>
        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
          {isIos ? '📱' : 'PWA'}
        </span>
      </button>
    </div>
  );
}