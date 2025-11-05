document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('buyNowModal');
  const btnConfirm = document.getElementById('buyNowConfirmBtn');
  const btnCancel = document.getElementById('buyNowCancelBtn');

  // função para abrir modal com dados (chamar de botões "Comprar" na página)
  window.openBuyConfirm = function({ produtoId, produtoNome, produtoImg, quantidade = 1 }) {
    if (!modal) return;
    document.getElementById('buyNowProductImg').src = produtoImg || '/images/placeholder.png';
    document.getElementById('buyNowProductName').textContent = produtoNome || '';
    document.getElementById('buyNowTitle').textContent = 'Confirmação de Compra';
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');

    // guardar dados no botão confirmar
    btnConfirm.dataset.produtoId = produtoId;
    btnConfirm.dataset.quantidade = quantidade;
  };

  // cancelar
  if (btnCancel) btnCancel.addEventListener('click', () => {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  });

  // enviar por AJAX para rota /comprar-agora (ajuste conforme sua rota)
  if (btnConfirm) btnConfirm.addEventListener('click', async (e) => {
    const produtoId = e.currentTarget.dataset.produtoId;
    const quantidade = e.currentTarget.dataset.quantidade || 1;

    try {
      const resp = await fetch('/comprar-agora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produtoId, quantidade })
      });
      const json = await resp.json();
      // se quiser redirecionar para pagamento:
      if (json.success && json.redirectUrl) {
        window.location.href = json.redirectUrl;
        return;
      }
      // fechar e mostrar mensagem
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      if (json.success) {
        alert('Compra iniciada com sucesso.');
      } else {
        alert(json.message || 'Erro ao efetuar compra.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede.');
    }
  });
});