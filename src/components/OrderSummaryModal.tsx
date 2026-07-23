import React, { useState } from 'react';
import { X, Mail, Copy, Check, FileSpreadsheet, Send, AlertCircle, ShoppingCart } from 'lucide-react';
import { Product, OrderItem } from '../types';

interface OrderSummaryModalProps {
  products: Product[];
  totalProductsCount?: number;
  counts: Record<string, number>;
  onClose: () => void;
  onSubmitOrder: (email: string, reporterName: string, store: string, items: OrderItem[]) => void;
  senderEmail: string;
  defaultEmail?: string;
}

export default function OrderSummaryModal({
  products,
  totalProductsCount,
  counts,
  onClose,
  onSubmitOrder,
  senderEmail,
  defaultEmail = 'elizeuamaral83@gmail.com'
}: OrderSummaryModalProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [store, setStore] = useState<'Loja do Carmo' | 'Loja Rua 4'>('Loja do Carmo');
  const [reporterName, setReporterName] = useState('');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState('');

  // Generate order items list based on products filtered on screen
  const orderItems: OrderItem[] = products.map(prod => {
    const countedQty = counts[prod.id] !== undefined ? counts[prod.id] : 0;
    const purchaseQty = Math.max(0, prod.minStock - countedQty);
    return {
      productId: prod.id,
      productName: prod.name,
      countedQty,
      neededQty: prod.minStock,
      purchaseQty,
      unit: prod.unit,
      supplier: prod.supplier,
      category: prod.category
    };
  });

  // Formatting Email Text Content
  const generateEmailText = (reportDate = new Date()) => {
    let body = `PEDIDO DE REPOSIÇÃO DE ESTOQUE\n`;
    body += `Loja: ${store}\n`;
    body += `Responsável pela Contagem: ${reporterName || 'Não Informado'}\n`;
    body += `Data do Relatório: ${reportDate.toLocaleDateString('pt-BR')} ${reportDate.toLocaleTimeString('pt-BR')}\n`;
    body += `E-mail de Envio (Remetente): ${senderEmail || 'Não Informado'}\n`;
    body += `E-mail Destinatário: ${email}\n`;
    body += `====================================================================================\n\n`;
    
    if (orderItems.length === 0) {
      body += `Nenhum produto filtrado na tela para reposição.\n\n`;
      body += `Gerado automaticamente via Central de Falta de Estoque.`;
      return body;
    }

    // Group items by supplier for neatness
    const grouped: Record<string, typeof orderItems> = {};
    orderItems.forEach(item => {
      if (!grouped[item.supplier]) grouped[item.supplier] = [];
      grouped[item.supplier].push(item);
    });

    Object.entries(grouped).forEach(([supplier, items]) => {
      // Find maximum length for padding each column
      let maxProductLen = 7; // Length of "Produto"
      let maxCurrentLen = 10; // Length of "Qtd. Atual"
      let maxMinLen = 15; // Length of "Mínimo Esperado"
      let maxPurchaseLen = 22; // Length of "Quantidade para Compra"

      items.forEach(item => {
        const prodName = item.productName || '';
        const currentQtyStr = `${item.countedQty} ${item.unit}`;
        const minQtyStr = `${item.neededQty} ${item.unit}`;
        const purchaseQtyStr = item.purchaseQty > 0 ? `+${item.purchaseQty} ${item.unit}` : `0 ${item.unit}`;

        if (prodName.length > maxProductLen) maxProductLen = prodName.length;
        if (currentQtyStr.length > maxCurrentLen) maxCurrentLen = currentQtyStr.length;
        if (minQtyStr.length > maxMinLen) maxMinLen = minQtyStr.length;
        if (purchaseQtyStr.length > maxPurchaseLen) maxPurchaseLen = purchaseQtyStr.length;
      });

      body += `FORNECEDOR: ${supplier}\n`;
      
      const colHeader1 = "Produto".padEnd(maxProductLen);
      const colHeader2 = "Qtd. Atual".padEnd(maxCurrentLen);
      const colHeader3 = "Mínimo Esperado".padEnd(maxMinLen);
      const colHeader4 = "Quantidade para Compra".padEnd(maxPurchaseLen);

      const dividerLen = maxProductLen + maxCurrentLen + maxMinLen + maxPurchaseLen + 9; // 3 spaces between cols (3 x 3)
      const borderLine = "-".repeat(dividerLen);

      body += `${borderLine}\n`;
      body += `${colHeader1} | ${colHeader2} | ${colHeader3} | ${colHeader4}\n`;
      body += `${borderLine}\n`;
      
      items.forEach(item => {
        const prodName = (item.productName || '').padEnd(maxProductLen);
        const currentQtyStr = `${item.countedQty} ${item.unit}`.padEnd(maxCurrentLen);
        const minQtyStr = `${item.neededQty} ${item.unit}`.padEnd(maxMinLen);
        const purchaseQtyStr = (item.purchaseQty > 0 ? `+${item.purchaseQty} ${item.unit}` : `0 ${item.unit}`).padEnd(maxPurchaseLen);

        body += `${prodName} | ${currentQtyStr} | ${minQtyStr} | ${purchaseQtyStr}\n`;
      });
      body += `${borderLine}\n\n`;
    });

    body += `Gerado automaticamente via Central de Falta de Estoque.`;
    return body;
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generateEmailText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadXLS = () => {
    const reportDate = new Date();
    const xlsHeader = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Relatório de Reposição</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; }
          th { background-color: #4f46e5; color: white; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
          td { border: 1px solid #cbd5e1; padding: 6px; }
          .header-info { font-weight: bold; font-size: 14px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="header-info">RELATÓRIO DE REPOSIÇÃO DE ESTOQUE - ${store}</div>
        <div><b>Data:</b> ${reportDate.toLocaleDateString('pt-BR')} ${reportDate.toLocaleTimeString('pt-BR')}</div>
        <div><b>Usuário Responsável:</b> ${reporterName || 'Não Informado'}</div>
        <div><b>E-mail de Envio (Remetente):</b> ${senderEmail || 'Não Informado'}</div>
        <div><b>Destinatário de E-mail:</b> ${email}</div>
        <br/>
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Quantidade Atual</th>
              <th>Estoque Mínimo</th>
              <th>Quantidade para Compra</th>
              <th>Unidade</th>
              <th>Fornecedor</th>
              <th>Categoria</th>
            </tr>
          </thead>
          <tbody>
    `;

    let xlsRows = '';
    orderItems.forEach(item => {
      xlsRows += `
        <tr>
          <td>${item.productName}</td>
          <td style="text-align: right;">${item.countedQty}</td>
          <td style="text-align: right;">${item.neededQty}</td>
          <td style="text-align: right; font-weight: bold; color: #b91c1c;">${item.purchaseQty}</td>
          <td>${item.unit}</td>
          <td>${item.supplier}</td>
          <td>${item.category}</td>
        </tr>
      `;
    });

    const xlsFooter = `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const xlsBlob = new Blob([xlsHeader + xlsRows + xlsFooter], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(xlsBlob);
    link.setAttribute("download", `pedido_compra_${store.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0,10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderEmail.trim() || !email.trim() || !reporterName.trim() || orderItems.length === 0) {
      setSendError('Preencha o e-mail de envio, o destinatário, o responsável e mantenha ao menos 1 item para envio.');
      return;
    }

    setSending(true);
    setSendError('');

    try {
      const reportDate = new Date();
      const subject = `Pedido de Reposição de Estoque - ${store} - ${reportDate.toLocaleDateString('pt-BR')}`;
      const response = await fetch('/api/send-order-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          senderEmail: senderEmail.trim(),
          recipientEmail: email.trim(),
          subject,
          body: generateEmailText(reportDate),
          reportDate: reportDate.toISOString(),
          reporterName: reporterName.trim(),
          store,
          items: orderItems
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload?.error || 'Falha ao enviar e-mail via Gmail.');
      }

      onSubmitOrder(email.trim(), reporterName.trim(), store, orderItems);
      setSendSuccess(true);
      setSending(false);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (error) {
      setSending(false);
      setSendError(error instanceof Error ? error.message : 'Não foi possível enviar o e-mail.');
      console.error('Falha ao enviar e-mail:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" id="order-modal-backdrop">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200" id="order-modal-content">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50" id="order-modal-header">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-slate-800" id="order-modal-title">
                Fechar Contagem & Gerar Pedido
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {totalProductsCount && products.length < totalProductsCount ? (
                  <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                    Itens Filtrados na Tela: {products.length} de {totalProductsCount} produto(s)
                  </span>
                ) : (
                  <span className="text-slate-500 text-[11px]">
                    Produtos na Tela: {products.length} item(ns)
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            id="btn-close-order-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6" id="order-modal-body">
          
          {/* Left: Configuration Form */}
          <div className="space-y-5" id="modal-left-column">
            
            {/* Email Form */}
            <form onSubmit={handleSubmitEmail} className="space-y-4" id="email-notif-form">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3" id="email-config-card">
                
                {/* Store Selector (LOJA) */}
                <div className="space-y-1.5">
                  <label htmlFor="store-select" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                    Loja de Origem
                  </label>
                  <select
                    id="store-select"
                    value={store}
                    onChange={e => setStore(e.target.value as 'Loja do Carmo' | 'Loja Rua 4')}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800 shadow-xs"
                  >
                    <option value="Loja do Carmo">Loja do Carmo</option>
                    <option value="Loja Rua 4">Loja Rua 4</option>
                  </select>
                </div>

                {/* Operator / Reporter Name */}
                <div className="space-y-1.5">
                  <label htmlFor="reporter-name" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                    Quem fez a falta no estoque *
                  </label>
                  <input
                    id="reporter-name"
                    type="text"
                    required
                    value={reporterName}
                    onChange={e => setReporterName(e.target.value)}
                    placeholder="Ex: Nome do Colaborador"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800 shadow-xs"
                  />
                </div>

                {/* Recipient Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    E-mail de Envio (Remetente)
                  </label>
                  <input
                    type="email"
                    value={senderEmail}
                    readOnly
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-100 text-slate-700 font-medium shadow-xs cursor-not-allowed"
                  />
                </div>

                {/* Recipient Email */}
                <div className="space-y-1.5">
                  <label htmlFor="recipient-email" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    E-mail do Destinatário
                  </label>
                  <input
                    id="recipient-email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Seu e-mail cadastrado"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800 shadow-xs"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Este e-mail receberá os dados formatados com as quantidades em falta e diferenças de compra.
                  </p>
                </div>
              </div>

              {/* Action Grid Buttons */}
              <div className="grid grid-cols-2 gap-2" id="utility-action-buttons">
                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 rounded-xl text-slate-600 text-xs font-medium shadow-xs transition-colors cursor-pointer"
                  id="btn-copy-email-draft"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      Copiar Texto
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadXLS}
                  disabled={orderItems.length === 0}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 rounded-xl text-slate-600 text-xs font-medium shadow-xs transition-colors cursor-pointer"
                  id="btn-download-order-xls"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Baixar Excel
                </button>
              </div>

              <button
                type="submit"
                disabled={sending || sendSuccess || orderItems.length === 0 || !reporterName.trim()}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 text-white rounded-xl font-display font-semibold text-xs shadow-md transition-all cursor-pointer ${
                  sendSuccess
                    ? 'bg-emerald-600 hover:bg-emerald-600'
                    : sending
                      ? 'bg-indigo-400'
                      : !reporterName.trim()
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 hover:scale-[1.01]'
                }`}
                id="btn-submit-order"
              >
                {sendSuccess ? (
                  <>
                    <Check className="w-4 h-4 shrink-0" />
                    Pedido Enviado com Sucesso!
                  </>
                ) : sending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></span>
                    Enviando via Gmail...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 shrink-0" />
                    Enviar Pedido & Alerta de Reposição
                  </>
                )}
              </button>
              {sendError && (
                <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {sendError}
                </p>
              )}
            </form>

          </div>

          {/* Right: Live plain email layout description preview */}
          <div className="flex flex-col h-full space-y-4" id="modal-right-column">
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 flex-1 flex flex-col justify-between" id="raw-email-preview">
              <div className="flex-1 flex flex-col">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Esboço Técnico do E-mail</span>
                <pre className="text-[10px] font-mono text-slate-600 bg-white p-3.5 rounded-lg overflow-auto flex-1 max-h-[300px] leading-relaxed select-all border border-slate-100">
                  {generateEmailText()}
                </pre>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
