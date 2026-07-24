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
    // 1. Gerar o arquivo Excel
    const excelBuffer = buildOrderWorkbook(data);
    const fileName = `pedido_reposicao_${data.store.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${data.reportDate.slice(0, 10)}.xlsx`;

    // 2. Montar a mensagem formatada
    const message = buildMessage(data);

    // 3. Verificar suporte a Web Share API
    if (!navigator.share) {
      // Fallback: Download do arquivo e copiar mensagem
      await downloadFile(excelBuffer, fileName);
      await copyToClipboard(message);
      return {
        success: true,
        message: 'Arquivo baixado e mensagem copiada! Cole no Telegram.'
      };
    }

    // 4. Criar arquivo para compartilhamento
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const file = new File([blob], fileName, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    // 5. Compartilhar via Web Share API
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

// Função para gerar o workbook do Excel
function buildOrderWorkbook(data: ShareData): Buffer {
  const { reportDate, reporterName, store, items } = data;
  const formattedDate = new Date(reportDate).toLocaleString('pt-BR');

  const rows = [
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
      item.countedQty,
      item.neededQty,
      item.purchaseQty,
      item.unit,
      item.supplier,
      item.category
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

// Função para montar a mensagem
function buildMessage(data: ShareData): string {
  const { reportDate, reporterName, store, items } = data;
  const formattedDate = new Date(reportDate).toLocaleString('pt-BR');

  let message = `📋 *SOLICITAÇÃO DE COMPRA*\n\n`;
  message += `🏪 *Loja:* ${store}\n`;
  message += `👤 *Responsável:* ${reporterName}\n`;
  message += `📅 *Data:* ${formattedDate}\n\n`;
  message += `📦 *Produtos em falta:*\n\n`;

  items.forEach((item, index) => {
    message += `${index + 1}. *${item.productName}*\n`;
    message += `   📊 Atual: ${item.countedQty} | Mínimo: ${item.neededQty}\n`;
    message += `   🛒 Comprar: ${item.purchaseQty} ${item.unit}\n`;
    message += `   🏷️ Fornecedor: ${item.supplier}\n\n`;
  });

  message += `---\n`;
  message += `📎 *Anexo:* Planilha com detalhes completa.\n`;
  message += `✅ *Solicitação gerada automaticamente pelo sistema C4 Gestão.*`;

  return message;
}

// Função para download do arquivo (fallback)
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

// Função para copiar texto para clipboard (fallback)
async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback para navegadores antigos
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}