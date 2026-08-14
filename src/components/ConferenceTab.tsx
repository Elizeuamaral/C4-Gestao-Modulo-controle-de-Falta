import React, { useMemo, useState } from 'react';
import { Search, PackageCheck, Download, Trash2, Plus, CalendarDays, Camera, Check, ClipboardList } from 'lucide-react';
import { Product, ConferenceEntry } from '../types';

interface ConferenceTabProps {
  products: Product[];
  entries: ConferenceEntry[];
  onAddEntry: (entry: Omit<ConferenceEntry, 'id' | 'createdAt'>) => void;
  onDeleteEntry: (entryId: string) => void;
}

const getTodayIso = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  if (year && month && day) return `${day}/${month}/${year}`;
  return value;
};

export default function ConferenceTab({ products, entries, onAddEntry, onDeleteEntry }: ConferenceTabProps) {
  const [mode, setMode] = useState<'entry' | 'history'>('entry');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('UN');
  const [lot, setLot] = useState('');
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [address, setAddress] = useState('');
  const [receivedDate, setReceivedDate] = useState(getTodayIso());
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [autoPhoto, setAutoPhoto] = useState(true);
  const [pendingEntries, setPendingEntries] = useState<ConferenceEntry[]>([]);

  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? null;

  const productSuggestions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products.slice(0, 8);
    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(term) ||
        product.supplier.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term)
      );
    }).slice(0, 8);
  }, [products, searchTerm]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setSupplier(product.supplier || '');
    setSearchTerm(product.name);
    setQuantity(1);
    setUnit(product.unit || 'UN');
    setLot('');
    setAddress('');
    setExpirationDate('');
    setReceivedDate(getTodayIso());
    setInvoiceNumber('');
    setNotes('');
  };

  const resetForm = () => {
    setSelectedProductId('');
    setSearchTerm('');
    setQuantity(1);
    setUnit('UN');
    setLot('');
    setSupplier('');
    setInvoiceNumber('');
    setAddress('');
    setReceivedDate(getTodayIso());
    setExpirationDate('');
    setNotes('');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProduct) return;

    const finalSupplier = supplier.trim() || selectedProduct.supplier;
    const finalUnit = unit || selectedProduct.unit || 'UN';
    const finalAddress = address.trim() || 'PRATELEIRA GERAL';
    const finalQuantity = Math.max(0, Number(quantity) || 0);

    if (finalQuantity <= 0) return;

    const newEntry: ConferenceEntry = {
      id: `CONF-${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      category: selectedProduct.category,
      supplier: finalSupplier,
      quantity: finalQuantity,
      unit: finalUnit,
      lot: lot.trim() || 'CAMPO BLOQUEADO',
      address: finalAddress,
      expirationDate: expirationDate || undefined,
      receivedDate: receivedDate || getTodayIso(),
      invoiceNumber: invoiceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    setPendingEntries((prev) => [newEntry, ...prev]);
    onAddEntry({
      productId: newEntry.productId,
      productName: newEntry.productName,
      category: newEntry.category,
      supplier: newEntry.supplier,
      quantity: newEntry.quantity,
      unit: newEntry.unit,
      lot: newEntry.lot,
      address: newEntry.address,
      expirationDate: newEntry.expirationDate,
      receivedDate: newEntry.receivedDate,
      invoiceNumber: newEntry.invoiceNumber,
      notes: newEntry.notes,
    });

    resetForm();
  };

  const exportEntriesReport = () => {
    const source = mode === 'history' ? entries : pendingEntries;
    if (!source.length) return;

    const headers = ['Produto', 'Categoria', 'Fornecedor', 'Quantidade', 'Unidade', 'Lote', 'Endereço', 'Recebimento', 'Vencimento', 'NF/Documento', 'Observações'];
    const rows = source.map((entry) => [
      entry.productName,
      entry.category,
      entry.supplier,
      String(entry.quantity),
      entry.unit,
      entry.lot,
      entry.address,
      formatDate(entry.receivedDate),
      formatDate(entry.expirationDate),
      entry.invoiceNumber || '',
      entry.notes || '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_conferencia_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConfirmEntries = () => {
    if (pendingEntries.length === 0) return;
    setPendingEntries([]);
  };

  const displayEntries = mode === 'history' ? entries : pendingEntries;

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="bg-[#f4f7fb] border border-slate-200 rounded-xl p-1 inline-flex w-full max-w-[420px] shadow-sm mb-5">
        <button
          type="button"
          onClick={() => setMode('entry')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
            mode === 'entry' ? 'bg-[#544af4] text-white shadow-md' : 'text-slate-600'
          }`}
        >
          Registrar Entrada
        </button>
        <button
          type="button"
          onClick={() => setMode('history')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
            mode === 'history' ? 'bg-[#544af4] text-white shadow-md' : 'text-slate-600'
          }`}
        >
          Consulta &amp; Histórico
        </button>
      </div>

      {mode === 'entry' ? (
        <div className="bg-[#f4f7fb] rounded-[18px] border border-slate-200 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#544af4] text-white flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <h2 className="text-[22px] font-bold text-slate-800">Registrar Entrada de Mercadoria</h2>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Bipe o código de barras ou digite aqui..."
                  className="w-full h-12 pl-10 pr-4 border border-slate-300 rounded-xl bg-white text-sm text-slate-700 placeholder:text-slate-400 shadow-inner"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={autoPhoto}
                  onChange={(event) => setAutoPhoto(event.target.checked)}
                  className="h-4 w-4 accent-[#544af4]"
                />
                Marcar foto automático
              </label>
            </div>

            {searchTerm && productSuggestions.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                {productSuggestions.map((product) => (
                  <button
                    type="button"
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className="w-full text-left px-3 py-2 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                  >
                    <div className="font-medium text-sm text-slate-800">{product.name}</div>
                    <div className="text-[11px] text-slate-500">{product.category} • {product.supplier}</div>
                  </button>
                ))}
              </div>
            )}

            <div className="grid md:grid-cols-[1.5fr_0.8fr_0.6fr] gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  value={selectedProduct ? selectedProduct.name : searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Selecione ou bipes um produto"
                  className="w-full h-12 px-3 border border-slate-300 rounded-xl bg-white text-sm text-slate-700 placeholder:text-slate-400 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Quantidade</label>
                <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-inner overflow-hidden h-12">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="w-10 h-full text-lg font-bold text-slate-600 hover:bg-slate-100"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                    className="w-full h-full text-center bg-transparent text-base font-semibold text-slate-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="w-10 h-full text-lg font-bold text-slate-600 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Unidade</label>
                <select
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  className="w-full h-12 px-3 border border-slate-300 rounded-xl bg-white text-sm text-slate-700 shadow-inner"
                >
                  <option value="UN">UN</option>
                  <option value="FD">FD</option>
                  <option value="CX">CX</option>
                  <option value="PCT">PCT</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-100/60 rounded-xl p-3 border border-slate-200">
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Detalhamento da Mercadoria</div>
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Número do Lote</label>
                  <input
                    type="text"
                    value={lot}
                    onChange={(event) => setLot(event.target.value)}
                    placeholder="CAMPO BLOQUEADO"
                    className="w-full h-11 px-3 border border-slate-300 rounded-xl bg-white text-sm text-slate-700 placeholder:text-slate-400 shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fabricação</label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(event) => setExpirationDate(event.target.value)}
                    className="w-full h-11 px-3 border border-slate-300 rounded-xl bg-white text-sm text-slate-700 shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Vencimento</label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(event) => setExpirationDate(event.target.value)}
                    className="w-full h-11 px-3 border border-slate-300 rounded-xl bg-white text-sm text-slate-700 shadow-inner"
                  />
                </div>
              </div>

              <div className="mt-3 grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Local de Armazenamento (Endereço no Estoque)</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="CAMPO BLOQUEADO"
                    className="w-full h-11 px-3 border border-slate-300 rounded-xl bg-white text-sm text-slate-700 placeholder:text-slate-400 shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Data de Lançamento</label>
                  <input
                    type="date"
                    value={receivedDate}
                    onChange={(event) => setReceivedDate(event.target.value)}
                    className="w-full h-11 px-3 border border-slate-300 rounded-xl bg-white text-sm text-slate-700 shadow-inner"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Observações adicionais</label>
              <input
                type="text"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Ex: Nota fiscal, fornecedor X, operador fulano..."
                className="w-full h-12 px-3 border border-slate-300 rounded-xl bg-white text-sm text-slate-700 placeholder:text-slate-400 shadow-inner"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedProduct}
              className="w-full h-12 rounded-xl bg-[#544af4] text-white text-sm font-bold uppercase tracking-wide shadow-md hover:bg-[#473bd6] disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <span className="inline-flex items-center gap-2"><Check className="w-4 h-4" /> OK - ADICIONAR NA LISTA</span>
            </button>
          </div>

          <div className="mt-5 border border-slate-200 rounded-xl bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
              <div className="text-sm font-bold text-slate-700">LISTA DE CONFERÊNCIA ({pendingEntries.length})</div>
              {pendingEntries.length > 0 && (
                <button
                  type="button"
                  onClick={exportEntriesReport}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-semibold"
                >
                  <Download className="w-3 h-3" />
                  Exportar
                </button>
              )}
            </div>

            {pendingEntries.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Nenhum item na fila. Bipe o produto e clique em OK para adicionar na lista.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {pendingEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <div className="font-semibold text-sm text-slate-800">{entry.productName}</div>
                      <div className="text-[11px] text-slate-500">{entry.quantity} {entry.unit} • {entry.lot} • {entry.address}</div>
                    </div>
                    <button type="button" onClick={() => setPendingEntries((prev) => prev.filter((item) => item.id !== entry.id))} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleConfirmEntries}
            disabled={pendingEntries.length === 0}
            className="mt-5 w-full h-12 rounded-xl bg-[#dfe5ee] text-slate-700 text-sm font-bold uppercase tracking-wide border border-slate-300 hover:bg-[#d4dce8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2"><ClipboardList className="w-4 h-4" /> CONFIRMAR ENTRADA EM ESTOQUE</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <CalendarDays className="w-5 h-5 text-[#544af4]" />
              Consulta e Histórico
            </div>
            <button
              type="button"
              onClick={exportEntriesReport}
              disabled={entries.length === 0}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar relatório
            </button>
          </div>

          {entries.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-500">Nenhum registro de conferência encontrado.</div>
          ) : (
            <div className="space-y-3 max-h-[620px] overflow-auto">
              {entries.map((entry) => (
                <div key={entry.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-800">{entry.productName}</div>
                      <div className="text-[11px] text-slate-500">{entry.supplier} • {entry.lot} • {entry.address}</div>
                    </div>
                    <button type="button" onClick={() => onDeleteEntry(entry.id)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 grid sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
                    <div><span className="font-semibold">Qtd:</span> {entry.quantity} {entry.unit}</div>
                    <div><span className="font-semibold">Fabr:</span> {formatDate(entry.expirationDate)}</div>
                    <div><span className="font-semibold">Receb:</span> {formatDate(entry.receivedDate)}</div>
                    <div><span className="font-semibold">NF:</span> {entry.invoiceNumber || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
