import React, { useState, useEffect } from 'react';
import { ClipboardList, Activity, User, Sparkles, Zap, Lock, AlertCircle, Settings } from 'lucide-react';
import { Product, OrderItem, Order } from './types';
import { INITIAL_PRODUCTS } from './mockData';
import ProductBaseTab from './components/ProductBaseTab';
import StockCountTab from './components/StockCountTab';
import OrderSummaryModal from './components/OrderSummaryModal';
import OrderHistoryTab from './components/OrderHistoryTab';
import { emailService } from './services/emailService';
import InstallBanner from './components/InstallBanner'; // ← USAR O BANNER

export default function App() {
  // ... (TODO O CÓDIGO EXISTENTE - NÃO ALTERAR)

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-800 antialiased" id="app-root">
      
      {/* ... (TODO O CÓDIGO EXISTENTE) */}

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