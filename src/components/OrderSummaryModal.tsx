import React, { useState } from 'react';
import { X, Send, Mail, User, Store, AlertCircle, Check, Building2 } from 'lucide-react';
import { Product, OrderItem } from '../types';
import { emailService } from '../services/emailService';

interface OrderSummaryModalProps {
  products: Product[];
  totalProductsCount: number;
  counts: Record<string, number>;
  senderEmail: string;
  onClose: () => void;
  onSubmitOrder: (email: string, reporterName: string, store: string, items: OrderItem[]) => Promise<void>;
  defaultEmail: string;
}

// Lista de lojas predefinidas
const STORE_OPTIONS = [
  'Loja do Carmo',
  'Loja Rua 4',
  'Loja Matriz',
  'Loja Filial 1',
  'Loja Filial 2',
  'Loja Centro',
  'Loja Norte',
  'Loja Sul',
  'Loja Leste',
  'Loja Oeste'
];

// E-mails sugeridos para o destinatário
const EMAIL_SUGGESTIONS = [
  'rt.comercio2026@gmail.com',
  'sosbebidas000@gmail.com',
  'compras@empresa.com'
];

function OrderSummaryModal({
  products,
  totalProductsCount,
  counts,
  senderEmail,
  onClose,
  onSubmitOrder,
  defaultEmail
}: OrderSummaryModalProps) {
  const [store, setStore] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('rt.comercio2026@gmail.com'); // Valor padrão alterado
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showStoreSuggestions, setShowStoreSuggestions] = useState(false);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);

  // Filtrar sugestões de lojas
  const filteredStores = STORE_OPTIONS.filter(s => 
    s.toLowerCase().includes(store.toLowerCase())
  );

  // Filtrar sugestões de e-mail
  const filteredEmails = EMAIL_SUGGESTIONS.filter(e => 
    e.toLowerCase().includes(recipientEmail.toLowerCase())
  );

  // Filtrar produtos com falta
  const filteredProducts = products.filter(p => {
    const counted = counts[p.id] || 0;
    return counted < p.minStock && p.active !== false;
  });

  // Gerar itens do pedido
  const orderItems: OrderItem[] = filteredProducts.map(p => {
    const counted = counts[p.id] || 0;
    const needed = p.minStock;
    const purchaseQty = needed - counted;
    return {
      productId: p.id,
      productName: p.name,
      countedQty: counted,
      neededQty: needed,
      purchaseQty: purchaseQty,
      unit: p.unit,
      supplier: p.supplier,
      category: p.category
    };
  });

  // Agrupar por fornecedor
  const groupedBySupplier = orderItems.reduce((acc, item) => {
    if (!acc[item.supplier]) {
      acc[item.supplier] = [];
    }
    acc[item.supplier].push(item);
    return acc;
  }, {} as Record<string, OrderItem[]>);

  // Enviar pedido
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!store.trim()) {
      setError('Por favor, informe a loja de origem.');
      return;
    }
    if (!reporterName.trim()) {
      setError('Por favor, informe quem fez a falta no estoque.');
      return;
    }
    if (!recipientEmail.trim()) {
      setError('Por favor, informe o e-mail do destinatário.');
      return;
    }
    if (orderItems.length === 0) {
      setError('Nenhum produto com falta para enviar.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await emailService.sendOrderEmail({
        recipientEmail: recipientEmail,
        reporterName: reporterName,
        store: store,
        items: orderItems,
        senderEmail: senderEmail,
        subject: `Solicitação de Compra - ${store}`
      });

      if (result.success) {
        setSuccessMessage('✅ ' + (result.message || 'E-mail enviado com sucesso!'));
        await onSubmitOrder(recipientEmail, reporterName, store, orderItems);
        setTimeout(() => onClose(), 2000);
      } else {
        setError('❌ ' + (result.error || 'Erro ao enviar e-mail.'));
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('❌ ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 rounded-t-2xl p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" />
              Fechar Contagem & Gerar Pedido
            </h2>
            <p className="text-xs text-slate-500">
              Produtos na Tela: {totalProductsCount} item(ns) | Em falta: {orderItems.length} item(ns)
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mensagem de sucesso */}
            {successMessage && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
                <Check className="w-4 h-4 shrink-0" />
                {successMessage}
              </div>
            )}

            {/* Campos do formulário */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Campo Loja com autocomplete */}
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Loja de Origem *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={store}
                    onChange={(e) => {
                      setStore(e.target.value);
                      setShowStoreSuggestions(true);
                    }}
                    onFocus={() => setShowStoreSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowStoreSuggestions(false), 200)}
                    placeholder="Digite o nome da loja..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                    required
                  />
                  {showStoreSuggestions && filteredStores.length > 0 && store.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredStores.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setStore(suggestion);
                            setShowStoreSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm text-slate-700 transition-colors flex items-center gap-2"
                        >
                          <Store className="w-4 h-4 text-slate-400" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 Sugestões: Loja do Carmo, Loja Rua 4, Loja Matriz, etc.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Quem fez a falta no estoque *
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  E-mail de Envio (Remetente)
                </label>
                <input
                  type="email"
                  value={senderEmail}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-sm"
                />
              </div>

              {/* Campo E-mail Destinatário com autocomplete */}
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  E-mail do Destinatário *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => {
                      setRecipientEmail(e.target.value);
                      setShowEmailSuggestions(true);
                    }}
                    onFocus={() => setShowEmailSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowEmailSuggestions(false), 200)}
                    placeholder="E-mail do destinatário..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                    required
                  />
                  {showEmailSuggestions && filteredEmails.length > 0 && recipientEmail.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredEmails.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setRecipientEmail(suggestion);
                            setShowEmailSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm text-slate-700 transition-colors flex items-center gap-2"
                        >
                          <Mail className="w-4 h-4 text-slate-400" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 Sugestão: rt.comercio2026@gmail.com
                </p>
              </div>
            </div>

            {/* ESBOÇO DO E-MAIL - COM COLUNAS ALINHADAS */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  ESBOÇO TÉCNICO DO E-MAIL
                </h3>
              </div>
              
              <div className="p-4 bg-white font-mono text-xs overflow-x-auto">
                {/* Cabeçalho do e-mail */}
                <div className="mb-3 space-y-0.5">
                  <p className="font-bold text-sm">PEDIDO DE REPOSIÇÃO DE ESTOQUE</p>
                  <p className="text-slate-600">Loja: {store || 'Não informada'}</p>
                  <p className="text-slate-600">Responsável pela Contagem: {reporterName || 'Não informado'}</p>
                  <p className="text-slate-600">Data do Relatório: {new Date().toLocaleString('pt-BR')}</p>
                  <p className="text-slate-600">E-mail de Envio (Remetente): {senderEmail}</p>
                  <p className="text-slate-600">E-mail Destinatário: {recipientEmail || 'Não informado'}</p>
                </div>

                <div className="border-t border-slate-200 my-3"></div>

                <p className="font-semibold text-slate-700 mb-2">PRODUTOS EM FALTA:</p>

                {/* Tabela por fornecedor - COM COLUNAS ALINHADAS */}
                {Object.entries(groupedBySupplier).map(([supplier, items]) => (
                  <div key={supplier} className="mb-4">
                    <p className="font-bold text-indigo-700 mb-1.5">FORNECEDOR: {supplier}</p>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="text-left px-3 py-1.5 font-semibold text-slate-700" style={{width: '40%'}}>Produto</th>
                            <th className="text-center px-3 py-1.5 font-semibold text-slate-700" style={{width: '15%'}}>Qtd. Atual</th>
                            <th className="text-center px-3 py-1.5 font-semibold text-slate-700" style={{width: '15%'}}>Estoque Mínimo</th>
                            <th className="text-center px-3 py-1.5 font-semibold text-slate-700" style={{width: '15%'}}>Qtd. para Compra</th>
                            <th className="text-center px-3 py-1.5 font-semibold text-slate-700" style={{width: '15%'}}>Unidade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => (
                            <tr key={item.productId} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="px-3 py-1.5 text-slate-800 font-medium">{item.productName}</td>
                              <td className="text-center px-3 py-1.5 text-slate-600">{item.countedQty}</td>
                              <td className="text-center px-3 py-1.5 text-slate-600">{item.neededQty}</td>
                              <td className="text-center px-3 py-1.5 text-amber-600 font-bold">{item.purchaseQty}</td>
                              <td className="text-center px-3 py-1.5 text-slate-500">{item.unit || 'un'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {Object.keys(groupedBySupplier).length === 0 && (
                  <p className="text-slate-400 text-center py-4">Nenhum produto em falta</p>
                )}

                <div className="border-t border-slate-200 my-3"></div>

                <div className="text-slate-500 text-[10px] space-y-0.5">
                  <p>📎 Planilha anexa com todos os detalhes.</p>
                  <p>✅ Solicitação gerada automaticamente pelo sistema C4 Gestão.</p>
                </div>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Botão Enviar */}
            <button
              type="submit"
              disabled={isSubmitting || orderItems.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Enviando...' : 'Enviar Pedido & Alerta de Reposição'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default OrderSummaryModal;