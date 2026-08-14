import React from 'react';
import { Package, Mail, Eye, Download } from 'lucide-react';
import { Order } from '../types';

interface OrderHistoryTabProps {
  orders: Order[];
  onConfirmReplenish: (orderId: string) => void;
  onDeleteOrder: (orderId: string) => void;
}

export default function OrderHistoryTab({
  orders,
  onConfirmReplenish,
  onDeleteOrder
}: OrderHistoryTabProps) {
  const exportReport = () => {
    if (orders.length === 0) return;

    const headers = ['ID', 'Data de envio', 'Relator', 'Loja', 'E-mail', 'Status', 'Itens'];
    const rows = orders.map(order => [
      order.id,
      new Date(order.createdAt).toLocaleString('pt-BR'),
      order.reporterName,
      order.store,
      order.recipientEmail,
      order.status === 'pending' ? 'Pendente' : 'Reposição confirmada',
      order.items.map(item => `${item.productName}: ${item.purchaseQty} ${item.unit}`).join(' | '),
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_historico_falta_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p className="text-lg font-medium">Nenhum pedido encontrado</p>
        <p className="text-sm">Os pedidos gerados aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Histórico de Falta de Estoque</h2>
        <button
          type="button"
          onClick={exportReport}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          Baixar relatório
        </button>
      </div>
      
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Data de Envio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Nome de Quem Fez a Falta</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Loja</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">E-mail Destinatário</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Itens</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={order.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-4 py-3 text-slate-700">
                    {new Date(order.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">
                    {order.reporterName}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {order.store}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs">{order.recipientEmail}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        // Mostrar detalhes dos itens
                        const itemsList = order.items.map(item => 
                          `  - ${item.productName}: ${item.purchaseQty} ${item.unit}`
                        ).join('\n');
                        alert(`📦 Produtos do Pedido ${order.id}:\n\n${itemsList}`);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-xs transition-colors flex items-center gap-1 mx-auto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver Itens
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <p className="text-xs text-slate-400 text-center mt-4">
        Total de pedidos: {orders.length}
      </p>
    </div>
  );
}