import React, { useState } from 'react';
import { Search, RotateCcw, ClipboardCheck, ArrowUpRight, ShoppingCart } from 'lucide-react';
import { Product, StockCount } from '../types';

interface StockCountTabProps {
  products: Product[];
  counts: Record<string, number>;
  onUpdateCount: (productId: string, quantity: number) => void;
  onResetCounts: () => void;
  onToggleActiveProduct?: (productId: string) => void;
  onGenerateOrder: (filteredProducts: Product[]) => void;
  showInactive: boolean;
  onToggleShowInactive: (show: boolean) => void;
}

export default function StockCountTab({
  products,
  counts,
  onUpdateCount,
  onResetCounts,
  onToggleActiveProduct,
  onGenerateOrder,
  showInactive,
  onToggleShowInactive
}: StockCountTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [showOnlyDeficient, setShowOnlyDeficient] = useState(false);

  // Filter products
  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory ? prod.category === filterCategory : true;
    const matchesSupplier = filterSupplier ? prod.supplier === filterSupplier : true;
    
    const counted = counts[prod.id] !== undefined ? counts[prod.id] : 0;
    const isDeficient = counted < prod.minStock;
    const matchesDeficient = showOnlyDeficient ? isDeficient : true;
    const matchesInactive = showInactive ? true : prod.active !== false;

    return matchesSearch && matchesCategory && matchesSupplier && matchesDeficient && matchesInactive;
  });

  // Active categories available given current search, supplier, and deficient filters
  const activeCategories = Array.from(
    new Set(
      products
        .filter(prod => {
          const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesSupplier = filterSupplier ? prod.supplier === filterSupplier : true;
          const counted = counts[prod.id] !== undefined ? counts[prod.id] : 0;
          const matchesDeficient = showOnlyDeficient ? counted < prod.minStock : true;
          const matchesInactive = showInactive ? true : prod.active !== false;
          return matchesSearch && matchesSupplier && matchesDeficient && matchesInactive;
        })
        .map(p => p.category)
    )
  ).filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));

  // Active suppliers available given current search, category, and deficient filters
  const activeSuppliers = Array.from(
    new Set(
      products
        .filter(prod => {
          const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesCategory = filterCategory ? prod.category === filterCategory : true;
          const counted = counts[prod.id] !== undefined ? counts[prod.id] : 0;
          const matchesDeficient = showOnlyDeficient ? counted < prod.minStock : true;
          const matchesInactive = showInactive ? true : prod.active !== false;
          return matchesSearch && matchesCategory && matchesDeficient && matchesInactive;
        })
        .map(p => p.supplier)
    )
  ).filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));

  // Stock deficiencies calculation (only active products are checked for replenishment unless showInactive is true)
  const missingItems = products.filter(prod => {
    if (prod.active === false && !showInactive) return false;
    const counted = counts[prod.id] !== undefined ? counts[prod.id] : 0;
    return counted < prod.minStock;
  });

  return (
    <div className="space-y-6" id="stock-count-tab-root">
      
      {/* Sticky Filter and Control Bar (Sticks below the fixed top menu) */}
      <div className="sticky top-[120px] sm:top-[126px] z-20 bg-slate-50/95 backdrop-blur-md pt-1 pb-3 mb-4 transition-all" id="counting-filter-bar-sticky-container">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3" id="counting-filter-bar">
          
          {/* Top Row: Search Input + Gerar Pedido de Reposição */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full" id="counting-search-row">
            <div className="relative flex-1 w-full" id="counting-search-wrapper">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por nome do produto..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                id="input-counting-search"
              />
            </div>

            <button
              type="button"
              onClick={() => onGenerateOrder(filteredProducts)}
              className={`shrink-0 w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-display font-semibold text-xs transition-all shadow-xs cursor-pointer ${
                missingItems.length > 0
                  ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white'
              }`}
              id="btn-trigger-order-generation-top"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {missingItems.length > 0 ? 'Gerar Pedido de Reposição' : 'Fechar Contagem & Gerar Pedido'}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bottom Row: Advanced Filter Category, Supplier, Apenas em Falta, Zerar Contagem */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100" id="counting-filter-dropdowns">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 min-w-[130px]"
              id="select-counting-filter-category"
            >
              <option value="">Todas Categorias</option>
              {activeCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={filterSupplier}
              onChange={e => setFilterSupplier(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 min-w-[130px]"
              id="select-counting-filter-supplier"
            >
              <option value="">Todos Fornecedores</option>
              {activeSuppliers.map(sup => (
                <option key={sup} value={sup}>{sup}</option>
              ))}
            </select>


            {/* Toggle filter showing only deficient items */}
            <button
              type="button"
              onClick={() => setShowOnlyDeficient(!showOnlyDeficient)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                showOnlyDeficient
                  ? 'bg-amber-50 border-amber-200 text-amber-700 font-semibold'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
              }`}
              id="btn-toggle-filter-deficient"
            >
              Apenas em Falta
            </button>

            <button
              type="button"
              onClick={() => onResetCounts()}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-500 text-xs font-medium transition-all cursor-pointer"
              title="Zerar todas as contagens para 0"
              id="btn-reset-all-counts"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Zerar Contagem
            </button>
          </div>
        </div>
      </div>

      {/* Main Stock-Counting List layout */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden" id="stock-counting-list-section">
        {filteredProducts.length > 0 ? (
          <div className="divide-y divide-slate-100" id="counting-items-container">
            {filteredProducts.map(prod => {
              // Current counted quantity. Defaults to 0 if reset or uncounted.
              const countValue = counts[prod.id];
              const currentQty = countValue !== undefined ? countValue : 0;
              
              // Status of item deficiency
              const deficiency = prod.minStock - currentQty;
              const isDeficient = deficiency > 0;
              const isCritical = isDeficient && currentQty === 0;

              return (
                <div 
                  key={prod.id} 
                  className={`py-2.5 px-3 sm:py-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 transition-colors ${
                    isCritical 
                      ? 'bg-rose-50/20 hover:bg-rose-50/40' 
                      : isDeficient 
                        ? 'bg-amber-50/10 hover:bg-amber-50/25' 
                        : 'hover:bg-slate-50/40'
                  }`}
                  id={`counting-row-${prod.id}`}
                >
                  {/* Left Side: Product Description + Média necessária em estoque */}
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3" id={`counting-row-details-${prod.id}`}>
                    <div className="flex items-center gap-2 shrink-0" id={`stock-product-name-${prod.id}`}>
                      <h4 className={`font-display font-medium text-xs sm:text-sm truncate ${
                        prod.active !== false ? 'text-slate-800' : 'text-slate-400 line-through'
                      }`}>
                        {prod.name}
                      </h4>
                    </div>

                    {prod.active === false && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md shrink-0">
                        Inativo
                      </span>
                    )}

                    <span className="text-[11px] text-slate-500 font-medium bg-slate-100/80 border border-slate-200/60 px-2 py-0.5 rounded-md shrink-0 self-start sm:self-center">
                      Média necessária: <strong className="text-slate-800 font-bold">{prod.minStock} {prod.unit}</strong>
                    </span>
                  </div>

                  {/* Right Side: Numeric count selector */}
                  <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center justify-end" id={`counting-row-inputs-${prod.id}`}>
                    
                    {/* Accurate quantity editor */}
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white" id={`numeric-pad-${prod.id}`}>
                      <button
                        type="button"
                        onClick={() => onUpdateCount(prod.id, Math.max(0, currentQty - 1))}
                        className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition-all text-sm shrink-0 cursor-pointer"
                        id={`btn-decrement-${prod.id}`}
                      >
                        -
                      </button>
                      
                      <input
                        type="number"
                        min="0"
                        value={currentQty}
                        placeholder="0"
                        onChange={e => {
                          const valStr = e.target.value;
                          const val = valStr === '' ? 0 : parseInt(valStr, 10);
                          onUpdateCount(prod.id, isNaN(val) ? 0 : Math.max(0, val));
                        }}
                        className="w-14 text-center font-mono font-bold text-slate-800 text-xs focus:outline-hidden focus:bg-indigo-50/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        id={`input-quantity-${prod.id}`}
                      />

                      <button
                        type="button"
                        onClick={() => onUpdateCount(prod.id, currentQty + 1)}
                        className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition-all text-sm shrink-0 cursor-pointer"
                        id={`btn-increment-${prod.id}`}
                      >
                        +
                      </button>
                    </div>

                    {/* Unit display */}
                    <span className="text-xs font-medium text-slate-400 w-8 font-mono shrink-0">
                      {prod.unit}
                    </span>

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center" id="empty-counting-state">
            <ClipboardCheck className="w-12 h-12 text-slate-200 mx-auto mb-3 animate-bounce-subtle" />
            <p className="text-base font-semibold text-slate-700">Tudo limpo por aqui!</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Nenhum produto cadastrado na base ou com contagem correspondente aos filtros.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
