import React, { useState } from 'react';
import { X, Send, Download, Copy, Check, AlertCircle, Mail, User, Store, FileSpreadsheet } from 'lucide-react';
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

export default function OrderSummaryModal({
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
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filtrar produtos com falta (countedQty < neededQty)
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

  // Gerar mensagem formatada
  const generateMessage = () => {
    const formattedDate = new Date().toLocaleString('pt-BR');
    let message = `PEDIDO DE REPOSIÇÃO DE ESTOQUE\n`;
    message += `${'='.repeat(50)}\n\n`;
    message += `Loja: ${store || 'Não informada'}\n`;
    message += `Responsável pela Contagem: ${reporterName || 'Não informado'}\n`;
    message += `Data do Relatório: ${formattedDate}\n`;
    message += `E-mail de Envio (Remetente): ${senderEmail}\n`;
    message += `E-mail Destinatário: ${recipientEmail}\n\n`;
    message += `${'='.repeat(50)}\n\n`;
    message += `PRODUTOS EM FALTA:\n\n`;

    Object.entries(groupedBySupplier).forEach(([supplier, items]) => {
      message += `FORNECEDOR: ${supplier}\n`;
      message += `${'-'.repeat(40)}\n`;
      items.forEach((item) => {
        message += `Produto: ${item.productName}\n`;
        message += `  Qtd. Atual: ${item.countedQty} ${item.unit}\n`;
        message += `  Estoque Mínimo: ${item.neededQty} ${item.unit}\n`;
        message += `  Quantidade para Compra: ${item.purchaseQty} ${item.unit}\n`;
        message += `  Categoria: ${item.category}\n\n`;
      });
    });

    message += `${'='.repeat(50)}\n\n`;
    message += `📎 Planilha anexa com todos os detalhes.\n`;
    message += `✅ Solicitação gerada automaticamente pelo sistema C4 Gestão.`;
    
    return message;
  };

  // Copiar texto
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('📋 Texto copiado para a área de transferência!');
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('📋 Texto copiado para a área de transferência!');
    });
  };

  // Enviar pedido via Google Apps Script
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
      // 1. Verificar se o serviço está configurado
      if (!emailService.isConfigured()) {
        setError('❌ Serviço de e-mail não configurado. Verifique o arquivo .env');
        setIsSubmitting(false);
        return;
      }

      // 2. Enviar via Google Apps Script
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
        
        // 3. Salvar no histórico
        await onSubmitOrder(recipientEmail, reporterName, store, orderItems);
        
        // 4. Fechar após 2 segundos
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError('❌ ' + (result.error || 'Erro ao enviar e-mail.'));
        setIsSubmitting(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar pedido.');
      setIsSubmitting(false);
    } finally {
      // Não setar isSubmitting false aqui porque pode fechar o modal
      // O state será resetado pelo timeout ou pelo erro
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
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
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  <Store className="w-4 h-4 inline mr-1" />
                  Loja de Origem *
                </label>
                <input
                  type="text"
                  value={store}
                  onChange={(e) => setStore(e.target.value)}
                  placeholder="Ex: Loja do Carmo"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                  required
                />
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
                  placeholder="Seu nome completo"
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
                <p className="text-[10px] text-slate-400 mt-1">E-mail configurado no sistema</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  E-mail do Destinatário *
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="compras@empresa.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">Este e-mail receberá os dados formatados com as quantidades em falta e diferenças de compra.</p>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => copyToClipboard(generateMessage())}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copiar Texto
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('📎 O Excel será anexado ao e-mail automaticamente quando você enviar o pedido.');
                }}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar Excel
              </button>
            </div>

            {/* Prévia da mensagem */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                ESBOÇO TÉCNICO DO E-MAIL
              </h3>
              <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono bg-white p-3 rounded-lg border border-slate-100 max-h-60 overflow-y-auto">
                {generateMessage()}
              </pre>
            </div>

            {/* Lista de produtos por fornecedor */}
            <div className="space-y-4">
              {Object.entries(groupedBySupplier).map(([supplier, items]) => (
                <div key={supplier} className="border border-slate-200 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-800 text-sm mb-2 bg-indigo-50 p-2 rounded-lg">
                    🏷️ FORNECEDOR: {supplier}
                  </h4>
                  <div className="grid grid-cols-1 gap-1">
                    {items.map((item) => (
                      <div key={item.productId} className="flex justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                        <span className="text-slate-700 font-medium">{item.productName}</span>
                        <span className="text-slate-500 text-xs">
                          Atual: {item.countedQty} {item.unit} | Mín: {item.neededQty} {item.unit} | 🛒 {item.purchaseQty} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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

            <div className="text-xs text-slate-400 text-center space-y-1">
              <p>💡 O e-mail será enviado automaticamente via Google Apps Script</p>
              <p>📧 O destinatário receberá o e-mail com o relatório em Excel anexado</p>
              <p>🔒 Não é necessário configurar senha de aplicativo Gmail</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}