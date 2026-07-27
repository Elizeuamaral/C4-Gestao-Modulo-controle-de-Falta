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

// 🔧 URL FIXA DO APPS SCRIPT (FALLBACK)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxUjNmtmzHWZRnwFLNQWMogAzSCek3saI3HoFtTuijr46dUL5u1KG8zdmumpGGJTqAJsg/exec';

export class EmailService {
  private apiUrl: string;
  private senderEmail: string;

  constructor() {
    // Tentar carregar do env, se não tiver, usar fallback
    this.apiUrl = import.meta.env?.VITE_APPS_SCRIPT_URL || APPS_SCRIPT_URL;
    this.senderEmail = import.meta.env?.VITE_SENDER_EMAIL || 'sosbebidas000@gmail.com';
    
    console.log('📧 EmailService inicializado:');
    console.log('  - API URL:', this.apiUrl ? '✅ Configurada' : '❌ FALTANDO');
    console.log('  - Sender Email:', this.senderEmail ? '✅ Configurado' : '❌ FALTANDO');
    console.log('  - Modo:', import.meta.env?.MODE || 'desconhecido');
  }

  async sendOrderEmail(data: EmailData): Promise<EmailResponse> {
    try {
      // 1. Validar URL
      if (!this.apiUrl) {
        console.error('❌ URL do Apps Script não configurada');
        return {
          success: false,
          error: 'URL do Google Apps Script não configurada.'
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

      // 5. Enviar usando modo no-cors
      await fetch(this.apiUrl, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('✅ Requisição enviada com sucesso (modo no-cors)');
      
      return {
        success: true,
        message: `E-mail enviado com sucesso para ${data.recipientEmail}`
      };

    } catch (error) {
      console.error('❌ Erro ao enviar e-mail:', error);
      
      let errorMessage = 'Erro desconhecido ao enviar e-mail';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Erro de conexão. Verifique se a URL do Apps Script está correta.';
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

  private generateExcelBase64(data: EmailData): string {
    try {
      const workbook = this.buildOrderWorkbook(data);
      const buffer = XLSX.write(workbook, { 
        type: 'array', 
        bookType: 'xlsx' 
      });
      
      const uint8Array = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);
      console.log('✅ Excel gerado (tamanho:', base64.length, 'caracteres)');
      return base64;
      
    } catch (error) {
      console.error('❌ Erro ao gerar Excel:', error);
      throw new Error('Falha ao gerar o arquivo Excel');
    }
  }

  private buildOrderWorkbook(data: EmailData): any {
    const { reporterName, store, items } = data;
    const formattedDate = new Date().toLocaleString('pt-BR');

    const rows: any[][] = [
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
        String(item.countedQty),
        String(item.neededQty),
        String(item.purchaseQty),
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