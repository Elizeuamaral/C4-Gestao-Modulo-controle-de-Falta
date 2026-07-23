import React, { useState } from 'react';
import { Package, Check, Calendar, Trash2, ChevronDown, ChevronUp, Store, User } from 'lucide-react';
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
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  return (
    <div className="space-y-6" id="order-history-tab-root">
      
      {/* Tab Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-6" id="history-header">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl" id="history-header-icon">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-slate-800" id="history-title">
              Histórico de Falta de Estoque
            </h2>
          </div>
        </div>
      </div>

      {/* History Table */}
      {orders.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden" id="history-table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs" id="history-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600">
                  <th className="p-4 font-medium">Data de Envio</th>
                  <th className="p-4 font-medium">Nome de Quem Fez a Falta</th>
                  <th className="p-4 font-medium">Loja</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const isPending = order.status === 'pending';

                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className="hover:bg-slate-50/50 text-slate-600 transition-colors"
                        id={`order-row-${order.id}`}
                      >
                        <td className="p-4 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatDate(order.createdAt)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-indigo-500/80" />
                            <span className="font-semibold text-slate-700">{order.reporterName || 'Não informado'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Store className="w-3.5 h-3.5 text-slate-400" />
                            <span>{order.store}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-semibold border ${
                            isPending
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {isPending ? 'Pendente' : 'Abastecido'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => toggleExpand(order.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-3.5 h-3.5" />
                                  Ocultar
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3.5 h-3.5" />
                                  Itens
                                </>
                              )}
                            </button>
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => onConfirmReplenish(order.id)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-emerald-200 bg-emerald-50 rounded-lg text-xs text-emerald-700 hover:bg-emerald-100"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Confirmar
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onDeleteOrder(order.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-rose-200 bg-rose-50 rounded-lg text-xs text-rose-700 hover:bg-rose-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={5} className="p-4">
                            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                              <table className="w-full text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                  <tr>
                                    <th className="p-2.5 text-left font-medium">Produto</th>
                                    <th className="p-2.5 text-center font-medium">Atual</th>
                                    <th className="p-2.5 text-center font-medium">Mínimo</th>
                                    <th className="p-2.5 text-center font-medium">Comprar</th>
                                    <th className="p-2.5 text-left font-medium">Fornecedor</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {order.items.map((item) => (
                                    <tr key={`${order.id}-${item.productId}`} className="text-slate-700">
                                      <td className="p-2.5">{item.productName}</td>
                                      <td className="p-2.5 text-center">{item.countedQty} {item.unit}</td>
                                      <td className="p-2.5 text-center">{item.neededQty} {item.unit}</td>
                                      <td className="p-2.5 text-center font-semibold text-rose-600">{item.purchaseQty} {item.unit}</td>
                                      <td className="p-2.5">{item.supplier}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl bg-white" id="empty-history-state">
          <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Nenhum histórico disponível</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Após realizar contagens de estoque e fechar relatórios, o histórico será preenchido aqui em estilo tabela com as datas e responsáveis correspondentes.
          </p>
        </div>
      )}
    </div>
  );
}
