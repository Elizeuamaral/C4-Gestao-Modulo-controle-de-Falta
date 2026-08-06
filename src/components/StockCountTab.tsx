import React, { useState } from 'react';
import { Search, Plus, Minus, RefreshCw, Send, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Product } from '../types';

interface StockCountTabProps {
  products: Product[];
  counts: Record<string, number>;
  onUpdateCount: (productId: string, quantity: number) => void;
  onResetCounts: () => void;
  onToggleActiveProduct: (id: string) => void;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Obter categorias e fornecedores únicos
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean).sort();
  const suppliers = Array.from(new Set(products.map(p => p.supplier))).filter(Boolean).sort();

  // Filtrar produtos
  const filteredProducts = products.filter(p => {
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

  // Produtos com falta (counted < minStock)
  const lowStockProducts = filteredProducts.filter(p => {
    const counted = counts[p.id] || 0;
    return counted < p.minStock;
  });

  const handleGenerateOrder = () => {
    onGenerateOrder(lowStockProducts);
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
          {lowStockProducts.length > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {lowStockProducts.length} em falta
            </span>
          )}
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
            disabled={lowStockProducts.length === 0}
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

      {/* Lista de produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredProducts.map((product) => {
          const counted = counts[product.id] || 0;
          const isLowStock = counted < product.minStock;
          const isInactive = product.active === false;

          return (
            <div
              key={product.id}
              className={`border rounded-xl p-3 transition-all ${
                isLowStock ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-white'
              } ${isInactive ? 'opacity-60 bg-slate-100' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium text-sm truncate ${isInactive ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-500">{product.supplier}</p>
                  <p className="text-xs text-slate-400">Mínimo: {product.minStock} {product.unit}</p>
                </div>
                <button
                  onClick={() => onToggleActiveProduct(product.id)}
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isInactive ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}
                >
                  {isInactive ? 'Inativo' : 'Ativo'}
                </button>
              </div>

              {/* 🔧 CAMPO DE QUANTIDADE - BLOQUEADO SE INATIVO */}
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!isInactive) {
                      onUpdateCount(product.id, Math.max(0, counted - 1));
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
                
                <div className="flex-1 text-center">
                  <span className={`text-lg font-bold ${isLowStock && !isInactive ? 'text-amber-600' : isInactive ? 'text-slate-400' : 'text-slate-700'}`}>
                    {counted}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">{product.unit}</span>
                </div>
                
                <button
                  onClick={() => {
                    if (!isInactive) {
                      onUpdateCount(product.id, counted + 1);
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

              {isLowStock && !isInactive && (
                <div className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Falta {product.minStock - counted} {product.unit}
                </div>
              )}
              
              {isInactive && (
                <div className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                  🔒 Produto inativo - contagem bloqueada
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          Nenhum produto encontrado.
        </div>
      )}
    </div>
  );
}