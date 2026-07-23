import React, { useState } from 'react';
import { Search, Plus, Trash2, Database, Upload, RefreshCw, X, FileSpreadsheet, Lock, AlertCircle, Sparkles, EyeOff, KeyRound, RotateCcw } from 'lucide-react';
import { Product } from '../types';
import ExcelImporter from './ExcelImporter';
import { INITIAL_PRODUCTS, CATEGORIES, SUPPLIERS } from '../mockData';

interface ProductBaseTabProps {
  products: Product[];
  onAddProduct: (prod: Omit<Product, 'id'>) => void;
  onImportProducts: (newProducts: Omit<Product, 'id'>[]) => void;
  onDeleteProduct: (id: string) => void;
  onToggleActiveProduct?: (id: string) => void;
  onClearAllProducts: () => void;
  onResetSystem: () => void;
  showInactive: boolean;
  onToggleShowInactive: (show: boolean) => void;
  onChangePassword: (currentPass: string, newPass: string) => { success: boolean; message: string };
}

export default function ProductBaseTab({
  products,
  onAddProduct,
  onImportProducts,
  onDeleteProduct,
  onToggleActiveProduct,
  onClearAllProducts,
  onResetSystem,
  showInactive,
  onToggleShowInactive,
  onChangePassword
}: ProductBaseTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');

  // Password Change Form State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeError('A nova senha e a confirmação de senha não coincidem.');
      return;
    }

    const res = onChangePassword(currentPasswordInput, newPasswordInput);
    if (!res.success) {
      setPasswordChangeError(res.message);
    } else {
      setPasswordChangeSuccess('Senha alterada com sucesso!');
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setPasswordChangeSuccess('');
      }, 2000);
    }
  };

  // Form State
  const [name, setName] = useState('');
  const [minStock, setMinStock] = useState<number>(0);
  const [category, setCategory] = useState('Mercearia');
  const [newCategory, setNewCategory] = useState('');
  const [supplier, setSupplier] = useState('Outros');
  const [newSupplier, setNewSupplier] = useState('');
  const [unit, setUnit] = useState('un');

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = category === 'Outros' && newCategory.trim() ? newCategory.trim() : category;
    const finalSupplier = supplier === 'Outros' && newSupplier.trim() ? newSupplier.trim() : supplier;

    onAddProduct({
      name: name.trim(),
      minStock: Number(minStock) || 0,
      category: finalCategory,
      supplier: finalSupplier,
      unit: unit.trim() || 'un',
      active: true
    });

    // Reset Form
    setName('');
    setMinStock(0);
    setNewCategory('');
    setNewSupplier('');
    setShowAddForm(false);
  };

  // Export base of products to Excel CSV (with UTF-8 BOM)
  const handleExportExcel = () => {
    if (products.length === 0) return;

    const headers = ['Código/ID', 'Nome do Produto', 'Categoria', 'Fornecedor', 'Estoque Necessário', 'Unidade', 'Status'];
    const rows = products.map((prod, index) => [
      `"${prod.id || index + 1}"`,
      `"${(prod.name || '').replace(/"/g, '""')}"`,
      `"${(prod.category || '').replace(/"/g, '""')}"`,
      `"${(prod.supplier || '').replace(/"/g, '""')}"`,
      prod.minStock || 0,
      `"${(prod.unit || 'un').replace(/"/g, '""')}"`,
      prod.active !== false ? '"Ativo"' : '"Inativo"'
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Base_Produtos_C4_Gestao_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtered lists
  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory ? prod.category.trim() === filterCategory : true;
    const matchesSupplier = filterSupplier ? prod.supplier.trim() === filterSupplier : true;
    return matchesSearch && matchesCategory && matchesSupplier;
  });

  // Get categories available for current search and supplier filter
  const activeCategories = Array.from(
    new Set(
      products
        .filter(prod => {
          const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesSupplier = filterSupplier ? prod.supplier.trim() === filterSupplier : true;
          return matchesSearch && matchesSupplier;
        })
        .map(p => p.category.trim())
    )
  ).filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));

  // Get suppliers available for current search and category filter
  const activeSuppliers = Array.from(
    new Set(
      products
        .filter(prod => {
          const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesCategory = filterCategory ? prod.category.trim() === filterCategory : true;
          return matchesSearch && matchesCategory;
        })
        .map(p => p.supplier.trim())
    )
  ).filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));

  // All categories and suppliers across all products for form select options
  const allCategories = Array.from(new Set(products.map(p => p.category.trim()))).filter(Boolean);
  const allSuppliers = Array.from(new Set(products.map(p => p.supplier.trim()))).filter(Boolean);

  // Dynamic lists combining baseline with active database products for manual registration dropdowns
  const dynamicCategories = Array.from(new Set([...CATEGORIES, ...allCategories])).filter(Boolean);
  const dynamicSuppliers = Array.from(new Set([...SUPPLIERS, ...allSuppliers])).filter(Boolean);

  const formCategories = dynamicCategories.includes('Outros') ? dynamicCategories : [...dynamicCategories, 'Outros'];
  const formSuppliers = dynamicSuppliers.includes('Outros') ? dynamicSuppliers : [...dynamicSuppliers, 'Outros'];

  return (
    <div className="space-y-6" id="product-base-tab-root">
      
      {/* Sticky Action Bar & Filters Header (Single Unified Card) */}
      <div className="sticky top-[120px] sm:top-[126px] z-20 bg-slate-50/95 backdrop-blur-md pt-1 pb-3" id="base-tab-sticky-header">
        
        {/* Single Unified Card for Actions and Filters */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3" id="base-tab-header-card">
          
          {/* Top Row: Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-2xl mx-auto w-full" id="base-header-actions">
            <button
              type="button"
              onClick={() => { setShowAddForm(!showAddForm); setShowImporter(false); }}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 font-semibold text-xs rounded-xl shadow-xs border transition-colors cursor-pointer w-full text-center ${
                showAddForm 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' 
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
              id="btn-toggle-add-manual"
            >
              <Plus className="w-3.5 h-3.5" />
              Lançar Manual
            </button>
            <button
              type="button"
              onClick={() => { setShowImporter(!showImporter); setShowAddForm(false); }}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 font-semibold text-xs rounded-xl shadow-xs border transition-colors cursor-pointer w-full text-center ${
                showImporter 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' 
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
              id="btn-toggle-importer"
            >
              <Upload className="w-3.5 h-3.5" />
              Importar Excel/CSV
            </button>
            {products.length === 0 && (
              <button
                type="button"
                onClick={() => onImportProducts(INITIAL_PRODUCTS)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer w-full text-center"
                id="btn-load-demo"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Carregar Dados de Teste
              </button>
            )}
            {products.length > 0 && (
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer w-full text-center"
                id="btn-export-excel"
                title="Exportar base de dados para Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Exportar Excel
              </button>
            )}
          </div>

          {/* Bottom Row: Search & Filters */}
          <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3" id="filters-container">
            <div className="relative flex-1 max-w-md" id="search-input-wrapper">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por produto..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                id="input-base-search"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2" id="filter-dropdowns">
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 min-w-[130px]"
                id="select-base-filter-category"
              >
                <option value="">Todas Categorias</option>
                {activeCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={filterSupplier}
                onChange={e => setFilterSupplier(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 min-w-[130px]"
                id="select-base-filter-supplier"
              >
                <option value="">Todos Fornecedores</option>
                {activeSuppliers.map(sup => (
                  <option key={sup} value={sup}>{sup}</option>
                ))}
              </select>
              
              {(filterCategory || filterSupplier || searchQuery) && (
                <button
                  type="button"
                  onClick={() => { setFilterCategory(''); setFilterSupplier(''); setSearchQuery(''); }}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 p-1.5"
                  id="btn-clear-filters"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>

          {/* Modern Toggle Switch Controls */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-700" id="card-checkbox-options">
            
            {/* Toggle 1: Mostrar itens inativos */}
            <label 
              htmlFor="checkbox-show-inactive"
              className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                showInactive 
                  ? 'border-blue-200 bg-blue-50/70 text-blue-950 shadow-xs' 
                  : 'border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/80 text-slate-700'
              }`}
              id="label-option-show-inactive"
            >
              <div className="relative inline-flex items-center shrink-0">
                <input
                  type="checkbox"
                  id="checkbox-show-inactive"
                  checked={showInactive}
                  onChange={(e) => onToggleShowInactive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                  showInactive ? 'bg-blue-600' : 'bg-slate-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    showInactive ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </div>
              <EyeOff className={`w-4 h-4 shrink-0 ${showInactive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span className="font-semibold text-xs">Mostrar itens inativos</span>
            </label>

            {/* Toggle 2: Trocar senha da aba Configuração */}
            <label 
              htmlFor="checkbox-change-password"
              className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                isChangePasswordOpen 
                  ? 'border-blue-200 bg-blue-50/70 text-blue-950 shadow-xs' 
                  : 'border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/80 text-slate-700'
              }`}
              id="label-option-change-password"
            >
              <div className="relative inline-flex items-center shrink-0">
                <input
                  type="checkbox"
                  id="checkbox-change-password"
                  checked={isChangePasswordOpen}
                  onChange={(e) => {
                    setIsChangePasswordOpen(e.target.checked);
                    if (!e.target.checked) {
                      setCurrentPasswordInput('');
                      setNewPasswordInput('');
                      setConfirmPasswordInput('');
                      setPasswordChangeError('');
                      setPasswordChangeSuccess('');
                    }
                  }}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                  isChangePasswordOpen ? 'bg-blue-600' : 'bg-slate-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    isChangePasswordOpen ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </div>
              <KeyRound className={`w-4 h-4 shrink-0 ${isChangePasswordOpen ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span className="font-semibold text-xs">Trocar senha da aba Configuração</span>
            </label>

            {/* Button 3: Resetar Sistema */}
            <button
              type="button"
              onClick={() => {
                const confirmed = window.confirm(
                  'ATENÇÃO: Deseja realmente resetar o sistema?\n\nEsta ação é irreversível e irá APAGAR PERMANENTEMENTE toda a Base de Dados de Produtos e todo o Histórico do Sistema.'
                );
                if (confirmed) {
                  onResetSystem();
                }
              }}
              className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-rose-200/90 bg-rose-50/80 hover:bg-rose-100 text-rose-700 transition-all cursor-pointer select-none shadow-2xs ml-auto sm:ml-0"
              id="btn-option-reset-system"
              title="Apagar Base de dados e histórico do sistema"
            >
              <RotateCcw className="w-4 h-4 shrink-0 text-rose-600 group-hover:rotate-[-45deg] transition-transform" />
              <span className="font-semibold text-xs">Resetar Sistema</span>
            </button>

          </div>

          {/* Expandable Password Change Form Card */}
          {isChangePasswordOpen && (
            <div className="mt-3 p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-3 animate-in fade-in duration-200" id="card-password-change-form">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Alterar Senha de Acesso do Módulo Configurações</span>
              </div>

              <form onSubmit={handlePasswordChangeSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Senha Atual</label>
                    <input
                      type="password"
                      value={currentPasswordInput}
                      onChange={e => setCurrentPasswordInput(e.target.value)}
                      placeholder="Senha atual..."
                      required
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      id="input-current-password"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nova Senha</label>
                    <input
                      type="password"
                      value={newPasswordInput}
                      onChange={e => setNewPasswordInput(e.target.value)}
                      placeholder="Nova senha..."
                      required
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      id="input-new-password"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      value={confirmPasswordInput}
                      onChange={e => setConfirmPasswordInput(e.target.value)}
                      placeholder="Confirmar nova senha..."
                      required
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      id="input-confirm-password"
                    />
                  </div>
                </div>

                {passwordChangeError && (
                  <div className="text-xs text-rose-600 font-semibold flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-2 rounded-lg" id="alert-password-change-error">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordChangeError}</span>
                  </div>
                )}

                {passwordChangeSuccess && (
                  <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 p-2 rounded-lg" id="alert-password-change-success">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{passwordChangeSuccess}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer transition-colors"
                    id="btn-save-new-password"
                  >
                    Salvar Nova Senha
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* Manual Add Form Panel */}
      {showAddForm && (
        <form onSubmit={handleManualAdd} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs max-w-2xl mx-auto space-y-4 relative" id="manual-add-form">
          <button 
            type="button" 
            onClick={() => setShowAddForm(false)} 
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            id="btn-close-add-form"
          >
            <X className="w-4 h-4" />
          </button>
          <h3 className="font-display font-medium text-lg text-slate-800 border-b border-slate-100 pb-2">
            Lançar Produto Manualmente
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="prod-name" className="text-xs font-medium text-slate-600">Nome do Produto *</label>
              <input
                id="prod-name"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Arroz Integral 1kg"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="prod-stock" className="text-xs font-medium text-slate-600">Qtd. Necessária *</label>
                <input
                  id="prod-stock"
                  type="number"
                  min="0"
                  required
                  value={minStock}
                  onChange={e => setMinStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="prod-unit" className="text-xs font-medium text-slate-600">Unidade</label>
                <input
                  id="prod-unit"
                  type="text"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder="Ex: un, kg, l"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="prod-category" className="text-xs font-medium text-slate-600">Categoria</label>
              <select
                id="prod-category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                {formCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {category === 'Outros' && (
                <input
                  type="text"
                  required
                  placeholder="Nova categoria"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full mt-2 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="prod-supplier" className="text-xs font-medium text-slate-600">Fornecedor</label>
              <select
                id="prod-supplier"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                {formSuppliers.map(sup => (
                  <option key={sup} value={sup}>{sup}</option>
                ))}
              </select>
              {supplier === 'Outros' && (
                <input
                  type="text"
                  required
                  placeholder="Novo fornecedor"
                  value={newSupplier}
                  onChange={e => setNewSupplier(e.target.value)}
                  className="w-full mt-2 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-xs font-medium hover:bg-slate-50 transition-all cursor-pointer"
              id="btn-cancel-manual-add"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-medium rounded-xl transition-all shadow-xs cursor-pointer"
              id="btn-submit-manual-add"
            >
              Adicionar Produto
            </button>
          </div>
        </form>
      )}

      {/* Importer Panel */}
      {showImporter && (
        <ExcelImporter
          onImport={(items) => {
            onImportProducts(items);
            setShowImporter(false);
          }}
        />
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden" id="products-table-section">
        
        {/* Products Table */}
        <div className="overflow-x-auto" id="base-products-table-wrapper">
          {filteredProducts.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600">
                  <th className="p-4 font-medium w-12 text-center">Ref</th>
                  <th className="p-4 font-medium w-28 text-center">Status</th>
                  <th className="p-4 font-medium">Nome do Produto</th>
                  <th className="p-4 font-medium">Categoria</th>
                  <th className="p-4 font-medium">Fornecedor</th>
                  <th className="p-4 font-medium text-center">Estoque Necessário</th>
                  <th className="p-4 font-medium w-16 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod, index) => {
                  const isActive = prod.active !== false;
                  return (
                    <tr key={prod.id} className={`hover:bg-slate-50/50 text-slate-600 group ${!isActive ? 'bg-slate-50/60' : ''}`} id={`product-row-${prod.id}`}>
                      <td className="p-4 text-center text-slate-400 font-mono text-[10px]">{index + 1}</td>
                      <td className="p-4 text-center">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none" id={`label-toggle-active-${prod.id}`}>
                          <div className="relative inline-flex items-center shrink-0">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() => onToggleActiveProduct?.(prod.id)}
                              className="sr-only peer"
                              id={`checkbox-active-${prod.id}`}
                            />
                            <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                              isActive ? 'bg-blue-600' : 'bg-slate-300'
                            }`}>
                              <div className={`w-4 h-4 bg-white rounded-full shadow-xs transform transition-transform duration-200 ease-in-out ${
                                isActive ? 'translate-x-4' : 'translate-x-0'
                              }`} />
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isActive 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </label>
                      </td>
                      <td className={`p-4 font-medium ${isActive ? 'text-slate-900' : 'text-slate-400 line-through'}`}>{prod.name}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                          {prod.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{prod.supplier}</td>
                      <td className="p-4 text-center font-mono font-semibold text-indigo-600 text-sm">
                        {prod.minStock} <span className="text-slate-400 font-normal text-xs">{prod.unit}</span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(prod.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shrink-0 cursor-pointer"
                          title="Excluir produto"
                          id={`btn-delete-prod-${prod.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center" id="empty-products-state">
              <Database className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">Nenhum produto cadastrado</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {products.length === 0 
                  ? 'Comece adicionando produtos individualmente, importando de uma planilha ou clicando em "Carregar Dados de Teste".' 
                  : 'Nenhum produto corresponde aos filtros de busca aplicados.'}
              </p>
            </div>
          )}
        </div>
        
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-slate-500 text-[11px] flex justify-between items-center" id="table-footer">
          <span>Mostrando {filteredProducts.length} de {products.length} produtos cadastrados</span>
          {products.length > 0 && <span className="font-mono text-[10px] text-slate-400">Total de Linhas no Banco: {products.length}</span>}
        </div>
      </div>
    </div>
  );
}
