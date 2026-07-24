import React from 'react';
import { Package, User, Store, Mail, Eye } from 'lucide-react';
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
      <h2 className="text-lg font-bold text-slate-800 mb-4">Histórico de Falta de Estoque</h2>
      
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