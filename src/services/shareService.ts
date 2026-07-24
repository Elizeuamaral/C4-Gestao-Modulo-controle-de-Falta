import * as XLSX from 'xlsx';
import { OrderItem } from '../types';

interface ShareData {
  reportDate: string;
  reporterName: string;
  store: string;
  items: OrderItem[];
}

export const shareTelegram = async (data: ShareData): Promise<{ success: boolean; message: string }> => {
  try {
    const excelBuffer = buildOrderWorkbook(data);
    const fileName = `pedido_reposicao_${data.store.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${data.reportDate.slice(0, 10)}.xlsx`;
    const message = buildMessage(data);

    if (!navigator.share) {
      console.log('📋 Mensagem para compartilhar:');
      console.log(message);
      console.log('📎 Arquivo:', fileName);
      
      await downloadFile(excelBuffer, fileName);
      await copyToClipboard(message);
      
      alert('✅ Arquivo baixado e mensagem copiada!\n\nCole a mensagem no Telegram e anexe o arquivo.');
      
      return {
        success: true,
        message: 'Arquivo baixado e mensagem copiada! Cole no Telegram.'
      };
    }

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const file = new File([blob], fileName, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    await navigator.share({
      title: 'Solicitação de Compra',
      text: message,
      files: [file]
    });

    return {
      success: true,
      message: 'Compartilhamento enviado com sucesso!'
    };
  } catch (error) {
    console.error('Erro no compartilhamento:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao compartilhar'
    };
  }
};

function buildOrderWorkbook(data: ShareData): Buffer {
  const { reportDate, reporterName, store, items } = data;
  const formattedDate = new Date(reportDate).toLocaleString('pt-BR');

  const rows: any[][] = [
    ['PEDIDO DE REPOSIÇÃO DE ESTOQUE'],
    ['Loja', store],
    ['Responsável pela Contagem', reporterName],
    ['Data do Relatório', formattedDate],
    [],
    ['Produto', 'Qtd. Atual', 'Estoque Mínimo', 'Quantidade para Compra', 'Unidade', 'Fornecedor', 'Categoria']
  ];

  items.forEach((item) => {
    rows.push([
      item.productName,
      String(item.countedQty),  // Converter para string
      String(item.neededQty),   // Converter para string
      String(item.purchaseQty), // Converter para string
      item.unit || 'un',
      item.supplier || 'Não informado',
      item.category || 'Geral'
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 32 },
    { wch: 12 },
    { wch: 16 },
    { wch: 22 },
    { wch: 10 },
    { wch: 24 },
    { wch: 20 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedido Reposição');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

function buildMessage(data: ShareData): string {
  const { reportDate, reporterName, store, items } = data;
  const formattedDate = new Date(reportDate).toLocaleString('pt-BR');

  let message = `📋 *SOLICITAÇÃO DE COMPRA - TELEGRAM*\n\n`;
  message += `🏪 *Loja:* ${store}\n`;
  message += `👤 *Responsável:* ${reporterName}\n`;
  message += `📅 *Data:* ${formattedDate}\n\n`;
  message += `📦 *Produtos em falta:*\n\n`;

  const grouped: Record<string, OrderItem[]> = {};
  items.forEach(item => {
    if (!grouped[item.supplier]) {
      grouped[item.supplier] = [];
    }
    grouped[item.supplier].push(item);
  });

  Object.entries(grouped).forEach(([supplier, supplierItems]) => {
    message += `🏷️ *FORNECEDOR: ${supplier}*\n`;
    message += `─────────────────────\n`;
    supplierItems.forEach((item) => {
      message += `📌 *${item.productName}*\n`;
      message += `   📊 Atual: ${item.countedQty} ${item.unit}\n`;
      message += `   📉 Mínimo: ${item.neededQty} ${item.unit}\n`;
      message += `   🛒 Comprar: ${item.purchaseQty} ${item.unit}\n\n`;
    });
  });

  message += `─────────────────────\n`;
  message += `📎 *Planilha anexa com todos os detalhes.*\n`;
  message += `✅ *Solicitação gerada automaticamente pelo sistema C4 Gestão.*`;

  return message;
}

function downloadFile(buffer: Buffer, fileName: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}