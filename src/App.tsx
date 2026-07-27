import InstallBanner from './components/InstallBanner'; // ← ADICIONAR

export default function App() {
  // ... resto do código

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-800 antialiased" id="app-root">
      
      {/* ... resto do conteúdo */}

      {/* Install Banner - FIXO NO RODAPÉ */}
      <InstallBanner />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 mt-auto" id="app-footer">
        <p>© 2026 Controle de Falta de Estoque. Todos os direitos reservados.</p>
        <p className="text-[10px] text-slate-300 mt-1 font-mono">Status do Sistema: Pronto para Tablets & Celulares</p>
        <p className="text-[10px] text-slate-300 mt-1">📧 Envio de e-mail via Google Apps Script</p>
      </footer>

    </div>
  );
}