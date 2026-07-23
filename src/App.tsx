import React, { useState, useEffect } from 'react';
import { Package, Database, ClipboardList, ShoppingCart, Activity, User, Sparkles, Zap, RotateCcw, Lock, AlertCircle, Settings } from 'lucide-react';
import { Product, OrderItem, Order } from './types';
import { INITIAL_PRODUCTS } from './mockData';
import ProductBaseTab from './components/ProductBaseTab';
import StockCountTab from './components/StockCountTab';
import OrderSummaryModal from './components/OrderSummaryModal';
import OrderHistoryTab from './components/OrderHistoryTab';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'counting' | 'database' | 'history'>('counting');
  
  // Password protection state for "Configurações"
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [configPassword, setConfigPassword] = useState<string>('@Maral22');
  const [showInactive, setShowInactive] = useState<boolean>(false);
  
  // App Core State (synchronized with localStorage)
  const [products, setProducts] = useState<Product[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [userEmail, setUserEmail] = useState<string>('elizeuamaral83@gmail.com');
  const [orderProducts, setOrderProducts] = useState<Product[] | null>(null);

  // UI Control State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem('estoq_products');
      const storedCounts = localStorage.getItem('estoq_counts');
      const storedOrders = localStorage.getItem('estoq_orders');
      const storedUserEmail = localStorage.getItem('estoq_user_email');
      const storedConfigPassword = localStorage.getItem('estoq_config_password');
      const storedShowInactive = localStorage.getItem('estoq_show_inactive');

      let loadedProducts: Product[] = [];
      if (storedProducts) {
        const parsed = JSON.parse(storedProducts) as Product[];
        loadedProducts = parsed.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
        setProducts(loadedProducts);
      } else {
        loadedProducts = [...INITIAL_PRODUCTS].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
        setProducts(loadedProducts);
        localStorage.setItem('estoq_products', JSON.stringify(loadedProducts));
      }

      if (storedCounts) {
        setCounts(JSON.parse(storedCounts));
      } else {
        const initialZeroCounts: Record<string, number> = {};
        loadedProducts.forEach(p => {
          initialZeroCounts[p.id] = 0;
        });
        setCounts(initialZeroCounts);
        localStorage.setItem('estoq_counts', JSON.stringify(initialZeroCounts));
      }
      if (storedOrders) setOrders(JSON.parse(storedOrders));
      if (storedUserEmail) setUserEmail(storedUserEmail);
      if (storedConfigPassword) setConfigPassword(storedConfigPassword);
      if (storedShowInactive) setShowInactive(storedShowInactive === 'true');
    } catch (e) {
      console.error('Erro ao ler do LocalStorage:', e);
    }
  }, []);

  // Save changes helper
  const saveProducts = (updatedProducts: Product[]) => {
    const sortedProducts = [...updatedProducts].sort((a, b) => 
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    );
    setProducts(sortedProducts);
    localStorage.setItem('estoq_products', JSON.stringify(sortedProducts));
  };

  const saveCounts = (updatedCounts: Record<string, number>) => {
    setCounts(updatedCounts);
    localStorage.setItem('estoq_counts', JSON.stringify(updatedCounts));
  };

  const saveOrders = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
    localStorage.setItem('estoq_orders', JSON.stringify(updatedOrders));
  };

  const saveUserEmail = (email: string) => {
    setUserEmail(email);
    localStorage.setItem('estoq_user_email', email);
  };

  // Toast / Banner helper
  const triggerBanner = (text: string, type: 'success' | 'info' = 'success') => {
    setBannerMessage({ text, type });
    setTimeout(() => {
      setBannerMessage(null);
    }, 4500);
  };

  // Product Database Actions
  const handleAddProduct = (newProd: Omit<Product, 'id'>) => {
    const productWithId: Product = {
      ...newProd,
      id: Date.now().toString()
    };
    const updated = [...products, productWithId];
    saveProducts(updated);
    triggerBanner(`Produto "${newProd.name}" cadastrado com sucesso!`);
  };

  const handleImportProducts = (importedProducts: Product[]) => {
    const normalizedMap = new Map<string, Product>();
    importedProducts.forEach((prod) => {
      const normalizedId = String(prod.id || '').trim();
      const normalizedName = String(prod.name || '').trim();
      if (!normalizedId || !normalizedName) return;

      normalizedMap.set(normalizedId, {
        id: normalizedId,
        name: normalizedName,
        category: String(prod.category || 'Outros').trim() || 'Outros',
        supplier: String(prod.supplier || 'Outros').trim() || 'Outros',
        minStock: Number(prod.minStock) || 0,
        unit: String(prod.unit || 'un').trim() || 'un',
        active: prod.active !== false
      });
    });

    const normalizedProducts = Array.from(normalizedMap.values());
    if (normalizedProducts.length === 0) {
      triggerBanner('Nenhum produto válido encontrado para substituir a base atual.', 'info');
      return;
    }

    saveProducts(normalizedProducts);

    const refreshedCounts: Record<string, number> = {};
    normalizedProducts.forEach((p) => {
      refreshedCounts[p.id] = counts[p.id] ?? 0;
    });
    saveCounts(refreshedCounts);

    triggerBanner(`Base substituída com sucesso: ${normalizedProducts.length} produtos carregados.`);
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    saveProducts(updated);

    // Clean active count for deleted product
    const updatedCounts = { ...counts };
    delete updatedCounts[id];
    saveCounts(updatedCounts);

    triggerBanner('Produto removido da base.');
  };

  const handleToggleActiveProduct = (id: string) => {
    const updated = products.map(p => 
      p.id === id ? { ...p, active: p.active === false ? true : false } : p
    );
    saveProducts(updated);
    const target = products.find(p => p.id === id);
    const newStatus = target?.active === false ? 'ativado' : 'inativado';
    triggerBanner(`Produto "${target?.name || ''}" foi ${newStatus}.`, 'info');
  };

  const handleClearAllProducts = () => {
    saveProducts([]);
    saveCounts({});
    triggerBanner('Todos os produtos e contagens foram removidos.', 'info');
  };

  const handleResetSystem = () => {
    saveProducts([]);
    saveCounts({});
    saveOrders([]);
    triggerBanner('Sistema resetado! A base de dados e o histórico foram completamente apagados.', 'info');
  };

  // Tab switching with Password Protection
  const handleTabClick = (tab: 'counting' | 'database' | 'history') => {
    if (tab === 'database') {
      setPasswordInput('');
      setPasswordError('');
      setIsPasswordModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === configPassword) {
      setIsPasswordModalOpen(false);
      setPasswordInput('');
      setPasswordError('');
      setActiveTab('database');
      triggerBanner('Acesso concedido ao módulo Configurações.', 'success');
    } else {
      setPasswordError('Senha incorreta! Digite a senha válida para continuar.');
    }
  };

  const handleUpdatePassword = (currentPass: string, newPass: string): { success: boolean; message: string } => {
    if (currentPass !== configPassword) {
      return { success: false, message: 'Senha atual incorreta! Digite a senha válida do módulo Configurações.' };
    }
    if (!newPass || newPass.trim().length < 3) {
      return { success: false, message: 'A nova senha precisa ter pelo menos 3 caracteres.' };
    }
    setConfigPassword(newPass.trim());
    localStorage.setItem('estoq_config_password', newPass.trim());
    triggerBanner('Senha da aba Configurações alterada com sucesso!', 'success');
    return { success: true, message: 'Senha alterada com sucesso!' };
  };

  const handleToggleShowInactive = (show: boolean) => {
    setShowInactive(show);
    localStorage.setItem('estoq_show_inactive', String(show));
    triggerBanner(show ? 'Exibindo produtos inativos na contagem.' : 'Produtos inativos ocultados da contagem.', 'info');
  };

  // Stock Counting Actions
  const handleUpdateCount = (productId: string, quantity: number) => {
    const updatedCounts = {
      ...counts,
      [productId]: quantity
    };
    saveCounts(updatedCounts);
  };

  const handleResetCounts = () => {
    const zeroCounts: Record<string, number> = {};
    products.forEach(p => {
      zeroCounts[p.id] = 0;
    });
    saveCounts(zeroCounts);
    triggerBanner('Todas as contagens foram zeradas para 0.', 'info');
  };

  // Order Submission & Replenishment Alert Logic
  const handleSubmitOrder = (email: string, reporterName: string, store: string, items: OrderItem[]) => {
    const newOrder: Order = {
      id: `PED-${Date.now()}`,
      createdAt: new Date().toISOString(),
      recipientEmail: email,
      reporterName: reporterName,
      store: store,
      items: items,
      status: 'pending' // pending replenishment alert
    };

    const updatedOrders = [newOrder, ...orders];
    saveOrders(updatedOrders);
    
    // Automatically switch view to history to show active replenishment alert
    setActiveTab('history');
    triggerBanner(`Pedido ${newOrder.id} gerado! Alerta de reposição ativo no histórico.`);
  };

  // Confirm Delivery / Replenish Stock
  const handleConfirmReplenish = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      triggerBanner('Pedido não encontrado para confirmação de reposição.', 'info');
      return;
    }

    // Update active stock count in state: Restore counted quantities of deficient items to full required capacity!
    const updatedCounts = { ...counts };
    order.items.forEach(item => {
      updatedCounts[item.productId] = item.neededQty; // Received required purchase, so current count meets required stock!
    });
    saveCounts(updatedCounts);

    // Set order status to replenished
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'replenished' as const };
      }
      return o;
    });
    saveOrders(updatedOrders);

    triggerBanner(`Estoque abastecido com sucesso! Quantidades atualizadas na contagem.`, 'success');
  };

  const handleDeleteOrder = (orderId: string) => {
    const updated = orders.filter(o => o.id !== orderId);
    saveOrders(updated);
    triggerBanner('Registro de pedido excluído do histórico.', 'info');
  };

  // Statistics calculation for badges
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-800 antialiased" id="app-root">
      
      {/* Top Banner Message */}
      {bannerMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300 max-w-md w-[90%]" id="system-toast-alert">
          <div className={`p-4 rounded-xl shadow-lg border flex items-center gap-3 ${
            bannerMessage.type === 'success' 
              ? 'bg-emerald-600 border-emerald-500 text-white' 
              : 'bg-indigo-600 border-indigo-500 text-white'
          }`}>
            <Sparkles className="w-5 h-5 shrink-0" />
            <span className="text-xs font-semibold leading-relaxed">{bannerMessage.text}</span>
          </div>
        </div>
      )}

      {/* Password Authentication Modal for Consulta & Produtos */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in" id="modal-password-overlay">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-up" id="modal-password-card">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 text-base">Acesso Protegido</h3>
                <p className="text-xs text-slate-500">Módulo Configurações</p>
              </div>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Digite a senha para acessar este módulo:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Senha de acesso..."
                    autoFocus
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-mono tracking-wider"
                    id="input-module-password"
                  />
                </div>
                {passwordError && (
                  <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setPasswordInput('');
                    setPasswordError('');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Acessar Módulo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sticky Top Header & Fixed Navigation Menu */}
      <div className="sticky top-0 z-30 bg-slate-50 border-b border-slate-200/80 shadow-xs" id="fixed-top-menu-wrapper">
        {/* Main App Navigation Header */}
        <header className="bg-[#0e1626] border-b border-slate-800 text-white shadow-md" id="app-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-3.5">
              
              {/* Logo, Title & Module Badge */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#00e676] text-slate-950 rounded-xl shadow-xs shrink-0" id="header-logo">
                    <Zap className="w-5 h-5 fill-slate-950" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="font-display font-extrabold text-white tracking-tight text-base sm:text-lg" id="header-app-name">
                        C4 Gestão
                      </h1>
                      <span className="bg-[#064e3b] text-[#34d399] border border-[#047857]/50 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Módulo Controle de Falta
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-normal">
                      Registro e conferência rápida de falta de estoque
                    </p>
                  </div>
                </div>

                {/* Sender Email Config on Mobile */}
                <div className="md:hidden flex items-center gap-1.5 text-xs bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1" id="header-user-mobile-panel">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => saveUserEmail(e.target.value)}
                    placeholder="E-mail de envio"
                    className="font-medium text-slate-200 bg-transparent focus:outline-hidden p-0 m-0 w-32 text-[11px]"
                    title="E-mail de envio (remetente)"
                  />
                </div>
              </div>

              {/* Desktop Quick Action / Sender Email */}
              <div className="hidden md:flex items-center gap-3" id="header-user-panel">
                <div className="flex items-center gap-2 text-xs bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="text-left">
                    <span className="text-[9px] text-slate-400 block font-medium uppercase leading-none">E-mail de envio</span>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => saveUserEmail(e.target.value)}
                      placeholder="Remetente Gmail"
                      className="font-semibold text-slate-200 bg-transparent focus:outline-hidden p-0 m-0 w-44 text-xs"
                      title="E-mail de envio (remetente)"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </header>

        {/* Navigation Tab Bar matching image style */}
        <div className="max-w-3xl mx-auto w-full px-4 py-2.5" id="nav-tabs-wrapper">
          <nav className="flex bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-xs justify-between gap-1.5" id="nav-tabs">
            <button
              type="button"
              onClick={() => handleTabClick('counting')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'counting'
                  ? 'bg-[#544af4] text-white shadow-md shadow-[#544af4]/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              id="tab-btn-counting"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Registrar Falta</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('history')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer relative ${
                activeTab === 'history'
                  ? 'bg-[#544af4] text-white shadow-md shadow-[#544af4]/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              id="tab-btn-history"
            >
              <Activity className="w-4 h-4" />
              <span>Histórico</span>
              {pendingOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ring-2 ring-white animate-pulse" id="badge-pending-count">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('database')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-[#544af4] text-white shadow-md shadow-[#544af4]/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              id="tab-btn-database"
            >
              <Settings className="w-4 h-4" />
              <span>Configurações</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Layout Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-3 pb-8" id="app-main-content">
        
        {/* Dynamic Render Tab Contents */}
        {activeTab === 'counting' && (
          <StockCountTab
            products={products}
            counts={counts}
            onUpdateCount={handleUpdateCount}
            onResetCounts={handleResetCounts}
            onToggleActiveProduct={handleToggleActiveProduct}
            onGenerateOrder={(filteredProds) => {
              setOrderProducts(filteredProds);
              setShowOrderModal(true);
            }}
            showInactive={showInactive}
            onToggleShowInactive={handleToggleShowInactive}
          />
        )}

        {activeTab === 'database' && (
          <ProductBaseTab
            products={products}
            onAddProduct={handleAddProduct}
            onImportProducts={handleImportProducts}
            onDeleteProduct={handleDeleteProduct}
            onToggleActiveProduct={handleToggleActiveProduct}
            onClearAllProducts={handleClearAllProducts}
            onResetSystem={handleResetSystem}
            showInactive={showInactive}
            onToggleShowInactive={handleToggleShowInactive}
            onChangePassword={handleUpdatePassword}
          />
        )}

        {activeTab === 'history' && (
          <OrderHistoryTab
            orders={orders}
            onConfirmReplenish={handleConfirmReplenish}
            onDeleteOrder={handleDeleteOrder}
          />
        )}

      </main>

      {/* Order Generation Modal Dialog */}
      {showOrderModal && (
        <OrderSummaryModal
          products={orderProducts ?? products}
          totalProductsCount={products.length}
          counts={counts}
          senderEmail={userEmail}
          onClose={() => {
            setShowOrderModal(false);
            setOrderProducts(null);
          }}
          onSubmitOrder={handleSubmitOrder}
          defaultEmail={userEmail}
        />
      )}

      {/* Footer copyright */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 mt-auto" id="app-footer">
        <p>© 2026 Controle de Falta de Estoque. Todos os direitos reservados.</p>
        <p className="text-[10px] text-slate-300 mt-1 font-mono">Status do Sistema: Pronto para Tablets & Celulares</p>
      </footer>

    </div>
  );
}
