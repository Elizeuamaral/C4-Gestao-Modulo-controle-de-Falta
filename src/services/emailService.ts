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
 */
export class EmailService {
  private apiUrl: string;
  private senderEmail: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_APPS_SCRIPT_URL || '';
    this.senderEmail = import.meta.env.VITE_SENDER_EMAIL || '';
    
    console.log('📧 EmailService inicializado:');
    console.log('  ✅ API URL:', this.apiUrl ? 'Configurada' : '❌ FALTANDO');
    console.log('  ✅ Sender Email:', this.senderEmail ? 'Configurado' : '❌ FALTANDO');
  }

  async sendOrderEmail(data: EmailData): Promise<EmailResponse> {
    try {
      console.log('📤 Iniciando envio de e-mail...');
      
      // 1. Validar URL
      if (!this.apiUrl) {
        return {
          success: false,
          error: 'URL do Google Apps Script não configurada'
        };
      }

      // 2. Validar dados
      if (!data.recipientEmail || !data.reporterName || !data.store || !data.items.length) {
        return {
          success: false,
          error: 'Dados incompletos para enviar o e-mail.'
        };
      }

      // 3. Gerar Excel em Base64
      console.log('📊 Gerando Excel...');
      const excelBase64 = this.generateExcelBase64(data);
      console.log('✅ Excel gerado (tamanho:', excelBase64.length, 'caracteres)');

      // 4. Preparar payload
      const payload = {
        recipientEmail: data.recipientEmail,
        reporterName: data.reporterName,
        store: data.store,
        items: data.items,
        senderEmail: this.senderEmail,
        subject: data.subject || `Solicitação de Compra - ${data.store}`,
        excelBase64: excelBase64
      };

      console.log('📤 Enviando para Apps Script...');
      console.log('  - URL:', this.apiUrl);
      console.log('  - Destinatário:', data.recipientEmail);

      // 5. Enviar requisição
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Status da resposta:', response.status);

      // 6. Processar resposta
      const result = await response.json();
      console.log('📥 Resposta:', result);

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return {
        success: result.success || false,
        message: result.message,
        error: result.error
      };

    } catch (error) {
      console.error('❌ Erro ao enviar e-mail:', error);
      
      let errorMessage = 'Erro ao enviar e-mail';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  private generateExcelBase64(data: EmailData): string {
    try {
      const workbook = this.buildOrderWorkbook(data);
      const buffer = XLSX.write(workbook, { 
        type: 'array', 
        bookType: 'xlsx' 
      });
      
      // Converter para Base64 de forma segura
      const uint8Array = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      return btoa(binary);
      
    } catch (error) {
      console.error('❌ Erro ao gerar Excel:', error);
      throw new Error('Falha ao gerar o arquivo Excel');
    }
  }

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

  isConfigured(): boolean {
    return !!this.apiUrl && !!this.senderEmail;
  }

  getApiUrl(): string {
    return this.apiUrl;
  }
}

export const emailService = new EmailService();