// Dentro do handleSubmit, substitua por:

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!store.trim()) {
    setError('Por favor, informe a loja de origem.');
    return;
  }
  if (!reporterName.trim()) {
    setError('Por favor, informe quem fez a falta no estoque.');
    return;
  }
  if (!recipientEmail.trim()) {
    setError('Por favor, informe o e-mail do destinatário.');
    return;
  }
  if (orderItems.length === 0) {
    setError('Nenhum produto com falta para enviar.');
    return;
  }

  setIsSubmitting(true);
  setError(null);
  setSuccessMessage(null);

  try {
    console.log('🚀 Enviando pedido...');
    console.log('📊 Dados:', {
      recipientEmail,
      reporterName,
      store,
      itemsCount: orderItems.length
    });

    // Enviar via Google Apps Script
    const result = await emailService.sendOrderEmail({
      recipientEmail: recipientEmail,
      reporterName: reporterName,
      store: store,
      items: orderItems,
      senderEmail: senderEmail,
      subject: `Solicitação de Compra - ${store}`
    });

    console.log('📥 Resultado:', result);

    if (result.success) {
      setSuccessMessage('✅ ' + (result.message || 'E-mail enviado com sucesso!'));
      
      // Salvar no histórico
      await onSubmitOrder(recipientEmail, reporterName, store, orderItems);
      
      // Fechar após 2 segundos
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setError('❌ ' + (result.error || 'Erro ao enviar e-mail.'));
      setIsSubmitting(false);
    }
  } catch (err) {
    console.error('❌ Erro detalhado:', err);
    setError('❌ ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    setIsSubmitting(false);
  }
};