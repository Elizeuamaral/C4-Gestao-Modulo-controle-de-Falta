import * as XLSX from 'xlsx';
import { OrderItem } from '../types';

interface EmailData {
  recipientEmail: string;
  reporterName: string;
  store: string;
  items: OrderItem[];
  senderEmail?: string;
  subject?: string;
}

interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Serviço para envio de e-mail via Google Apps Script
 * Substitui completamente o Nodemailer + Gmail SMTP
 */
export class EmailService {
  private apiUrl: string;
  private senderEmail: string;

  constructor() {
    // URL do Web App do Google Apps Script
    this.apiUrl = import.meta.env.VITE_APPS_SCRIPT_URL || '';
    this.senderEmail = import.meta.env.VITE_SENDER_EMAIL || '';
    
    if (!this.apiUrl) {
      console.warn('⚠️ VITE_APPS_SCRIPT_URL não configurado no .env');
    }
    
    if (!this.senderEmail) {
      console.warn('⚠️ VITE_SENDER_EMAIL não configurado no .env');
    }
  }

  /**
   * Envia um e-mail com relatório em Excel anexado
   * @param data - Dados do pedido
   * @returns Promise<EmailResponse>
   */
  async sendOrderEmail(data: EmailData): Promise<EmailResponse> {
    try {
      // 1. Validar URL
      if (!this.apiUrl) {
        return {
          success: false,
          error: 'URL do Google Apps Script não configurada. Verifique o arquivo .env'
        };
      }

      // 2. Validar dados obrigatórios
      if (!data.recipientEmail || !data.reporterName || !data.store || !data.items.length) {
        return {
          success: false,
          error: 'Dados incompletos para enviar o e-mail.'
        };
      }

      // 3. Validar e-mail do remetente
      if (!this.senderEmail) {
        return {
          success: false,
          error: 'E-mail de envio não configurado. Verifique o arquivo .env'
        };
      }

      // 4. Gerar arquivo Excel em Base64
      const excelBase64 = this.generateExcelBase64(data);

      // 5. Preparar payload
      const payload = {
        recipientEmail: data.recipientEmail,
        reporterName: data.reporterName,
        store: data.store,
        items: data.items,
        senderEmail: this.senderEmail,
        subject: data.subject || `Solicitação de Compra - ${data.store}`,
        excelBase64: excelBase64,
        timestamp: new Date().toISOString()
      };

      // 6. Enviar para o Google Apps Script
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        // Timeout de 30 segundos
        signal: AbortSignal.timeout(30000)
      });

      // 7. Processar resposta
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: result.success || false,
        message: result.message,
        error: result.error
      };

    } catch (error) {
      console.error('❌ Erro ao enviar e-mail:', error);
      
      let errorMessage = 'Erro desconhecido ao enviar e-mail';
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          errorMessage = 'Tempo limite excedido. O servidor demorou muito para responder.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Gera o arquivo Excel e retorna em Base64
   */
  private generateExcelBase64(data: EmailData): string {
    try {
      // Gerar o workbook
      const workbook = this.buildOrderWorkbook(data);
      
      // Gerar buffer
      const buffer = XLSX.write(workbook, { 
        type: 'array', 
        bookType: 'xlsx' 
      });

      // Converter para Base64
      const base64 = btoa(
        String.fromCharCode(...new Uint8Array(buffer))
      );

      return base64;

    } catch (error) {
      console.error('❌ Erro ao gerar Excel:', error);
      throw new Error('Falha ao gerar o arquivo Excel');
    }
  }

  /**
   * Constrói o workbook do Excel
   */
  private buildOrderWorkbook(data: EmailData): any {
    const { reporterName, store, items } = data;
    const formattedDate = new Date().toLocaleString('pt-BR');

    const rows = [
      ['PEDIDO DE REPOSIÇÃO DE ESTOQUE'],
      ['Loja', store],
      ['Responsável pela Contagem', reporterName],
      ['Data do Relatório', formattedDate],
      ['E-mail de Envio (Remetente)', this.senderEmail],
      ['E-mail Destinatário', data.recipientEmail],
      [],
      ['Produto', 'Qtd. Atual', 'Estoque Mínimo', 'Quantidade para Compra', 'Unidade', 'Fornecedor', 'Categoria']
    ];

    items.forEach((item) => {
      rows.push([
        item.productName,
        item.countedQty,
        item.neededQty,
        item.purchaseQty,
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
    return workbook;
  }

  /**
   * Verifica se o serviço está configurado corretamente
   */
  isConfigured(): boolean {
    return !!this.apiUrl && !!this.senderEmail;
  }

  /**
   * Obtém a URL do serviço (para debug)
   */
  getApiUrl(): string {
    return this.apiUrl;
  }
}

// Exportar instância única (Singleton)
export const emailService = new EmailService();