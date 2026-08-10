import React, { useState } from 'react';
import { Search, Plus, Minus, RefreshCw, Send, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Product } from '../types';

interface StockCountTabProps {
  products: Product[];
  counts: Record<string, number>;
  onUpdateCount: (productId: string, quantity: number, unit: string) => void;
  onResetCounts: () => void;
  onToggleActiveProduct: (id: string) => void;
  onGenerateOrder: (filteredProducts: Product[]) => void;
  showInactive: boolean;
  onToggleShowInactive: (show: boolean) => void;
}

// Opções de unidade disponíveis
const UNIT_OPTIONS = ['FD', 'CX', 'PCT', 'UN'];

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Carregar unidades selecionadas do localStorage
  const [selectedUnits, setSelectedUnits] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('estoq_units');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Obter categorias e fornecedores únicos
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean).sort();
  const suppliers = Array.from(new Set(products.map(p => p.supplier))).filter(Boolean).sort();

  // 🔧 FUNÇÃO DE FILTRAGEM - APLICA TODOS OS FILTROS
  const getFilteredProducts = () => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory ? p.category === filterCategory : true;
      const matchesSupplier = filterSupplier ? p.supplier === filterSupplier : true;
      const isActive = showInactive ? true : p.active !== false;
      const counted = counts[p.id] || 0;
      const isLowStock = counted < p.minStock;
      const matchesLowStock = onlyLowStock ? isLowStock : true;
      
      return matchesSearch && matchesCategory && matchesSupplier && isActive && matchesLowStock;
    });
  };

  // 🔧 PRODUTOS FILTRADOS (VISÍVEIS NA TELA)
  const filteredProducts = getFilteredProducts();

  // 🔧 ENVIAR TODOS OS PRODUTOS FILTRADOS (NÃO APENAS EM FALTA)
  const handleGenerateOrder = () => {
    // Agora envia TODOS os produtos filtrados, independente de estar em falta ou não
    onGenerateOrder(filteredProducts);
  };

  // Obter unidade selecionada para um produto
  const getUnitForProduct = (product: Product): string => {
    if (selectedUnits[product.id]) return selectedUnits[product.id];
    if (UNIT_OPTIONS.includes(product.unit)) return product.unit;
    return UNIT_OPTIONS[0]; // FD
  };

  // Atualizar unidade selecionada
  const handleUnitChange = (productId: string, unit: string) => {
    setSelectedUnits(prev => {
      const newUnits = { ...prev, [productId]: unit };
      localStorage.setItem('estoq_units', JSON.stringify(newUnits));
      return newUnits;
    });
    const currentCount = counts[productId] || 0;
    onUpdateCount(productId, currentCount, unit);
  };

  // Atualizar quantidade
  const handleUpdateCount = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const unit = getUnitForProduct(product);
    onUpdateCount(productId, quantity, unit);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-800">Registrar Falta</h2>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
            {filteredProducts.length} produtos
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onToggleShowInactive(!showInactive)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-medium transition-colors"
          >
            {showInactive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showInactive ? 'Ocultar Inativos' : 'Mostrar Inativos'}
          </button>
          <button
            onClick={onResetCounts}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Zerar Contagens
          </button>
          <button
            onClick={handleGenerateOrder}
            disabled={filteredProducts.length === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Gerar Pedido
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por nome do produto..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="">Todas Categorias</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={filterSupplier}
          onChange={(e) => setFilterSupplier(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="">Todos Fornecedores</option>
          {suppliers.map(sup => (
            <option key={sup} value={sup}>{sup}</option>
          ))}
        </select>
        <button
          onClick={() => setOnlyLowStock(!onlyLowStock)}
          className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            onlyLowStock 
              ? 'bg-amber-100 border border-amber-300 text-amber-700' 
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {onlyLowStock ? '✓ Apenas em Falta' : 'Apenas em Falta'}
        </button>
      </div>

      {/* TABELA DE PRODUTOS - LISTA */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Produto</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Fornecedor</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Mínimo</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Quantidade</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Unidade</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => {
                const counted = counts[product.id] || 0;
                const isLowStock = counted < product.minStock;
                const isInactive = product.active === false;
                const currentUnit = getUnitForProduct(product);

                return (
                  <tr 
                    key={product.id} 
                    className={`hover:bg-slate-50 transition-colors ${
                      isLowStock && !isInactive ? 'bg-amber-50/50' : ''
                    } ${isInactive ? 'opacity-60 bg-slate-50' : ''}`}
                  >
                    <td className="px-4 py-2.5">
                      <span className={`font-medium ${isInactive ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {product.name}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs">
                      {product.supplier}
                    </td>
                    <td className="px-4 py-2.5 text-center text-slate-600 text-xs">
                      {product.minStock}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            if (!isInactive) {
                              handleUpdateCount(product.id, Math.max(0, counted - 1));
                            }
                          }}
                          disabled={isInactive}
                          className={`p-1 rounded-lg transition-colors ${
                            isInactive 
                              ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                              : 'hover:bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className={`w-12 text-center font-bold text-base ${
                          isLowStock && !isInactive ? 'text-amber-600' : isInactive ? 'text-slate-400' : 'text-slate-700'
                        }`}>
                          {counted}
                        </span>
                        <button
                          onClick={() => {
                            if (!isInactive) {
                              handleUpdateCount(product.id, counted + 1);
                            }
                          }}
                          disabled={isInactive}
                          className={`p-1 rounded-lg transition-colors ${
                            isInactive 
                              ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                              : 'hover:bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <select
                        value={currentUnit}
                        onChange={(e) => {
                          if (!isInactive) {
                            handleUnitChange(product.id, e.target.value);
                          }
                        }}
                        disabled={isInactive}
                        className={`px-2 py-1 text-xs border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white ${
                          isInactive 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' 
                            : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        {UNIT_OPTIONS.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {isInactive ? (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-600 rounded-full">
                          Inativo
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded-full flex items-center gap-1 justify-center">
                          <AlertTriangle className="w-3 h-3" />
                          Em falta
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded-full">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="py-8 text-center text-slate-500 text-sm">
            Nenhum produto encontrado com os filtros atuais.
          </div>
        )}
      </div>
    </div>
  );
}