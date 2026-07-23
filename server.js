import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import nodemailer from 'nodemailer';
import * as XLSX from 'xlsx';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 3000);
const distPath = path.join(__dirname, 'dist');

app.use(express.json({ limit: '1mb' }));

function buildOrderWorkbook({ reportDate, reporterName, senderEmail, recipientEmail, store, items }) {
  const formattedDate = new Date(reportDate).toLocaleString('pt-BR');
  const rows = [
    ['PEDIDO DE REPOSICAO DE ESTOQUE'],
    ['Loja', store],
    ['Responsavel pela Contagem', reporterName],
    ['Data do Relatorio', formattedDate],
    ['E-mail de Envio (Remetente)', senderEmail],
    ['E-mail Destinatario', recipientEmail],
    [],
    ['Produto', 'Qtd. Atual', 'Estoque Minimo', 'Quantidade para Compra', 'Unidade', 'Fornecedor', 'Categoria']
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
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedido Reposicao');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

app.post('/api/send-order-email', async (req, res) => {
  const senderEmail = String(req.body?.senderEmail || '').trim();
  const recipientEmail = String(req.body?.recipientEmail || '').trim();
  const subject = String(req.body?.subject || '').trim();
  const body = String(req.body?.body || '').trim();
  const reportDate = String(req.body?.reportDate || '').trim();
  const reporterName = String(req.body?.reporterName || '').trim();
  const store = String(req.body?.store || '').trim();
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const gmailAppPassword = String(process.env.GMAIL_APP_PASSWORD || '').trim();

  if (!senderEmail || !recipientEmail || !subject || !body || !reportDate || !reporterName || !store || items.length === 0) {
    return res.status(400).json({ error: 'Dados incompletos para envio de e-mail.' });
  }

  if (!gmailAppPassword) {
    return res.status(500).json({
      error: 'GMAIL_APP_PASSWORD não configurado no arquivo .env da raiz do projeto.'
    });
  }

  try {
    const attachmentBuffer = buildOrderWorkbook({
      reportDate,
      reporterName,
      senderEmail,
      recipientEmail,
      store,
      items
    });
    const safeStore = store.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
    const safeDate = reportDate.slice(0, 10);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: gmailAppPassword
      }
    });

    await transporter.sendMail({
      from: senderEmail,
      to: recipientEmail,
      subject,
      text: body,
      attachments: [
        {
          filename: `pedido_reposicao_${safeStore}_${safeDate}.xlsx`,
          content: attachmentBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      ]
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao enviar e-mail via Gmail.';
    return res.status(500).json({ error: message });
  }
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'Rota de API não encontrada.' });
      return;
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor iniciado em:`);
  console.log(`- Local:   http://localhost:${port}`);
  console.log(`- Local:   http://127.0.0.1:${port}`);
  console.log(`- Rede:    http://SEU_IP_LOCAL:${port}`);
});
