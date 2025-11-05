document.addEventListener("DOMContentLoaded", () => {
    const numeroCartao = document.getElementById("numeroCartao");
    const validade = document.getElementById("validade");
    const cvv = document.getElementById("cvv");

    if (numeroCartao) {
        numeroCartao.addEventListener("input", () => {
            numeroCartao.value = numeroCartao.value
                .replace(/\D/g, "")
                .replace(/(\d{4})(?=\d)/g, "$1 ")
                .trim();
        });
    }

    if (validade) {
        validade.addEventListener("input", () => {
            validade.value = validade.value
                .replace(/\D/g, "")
                .replace(/(\d{2})(\d)/, "$1/$2")
                .substr(0, 5);
        });
    }

    if (cvv) {
        cvv.addEventListener("input", () => {
            cvv.value = cvv.value.replace(/\D/g, "").substr(0, 3);
        });
    }

    // Aplica tema conforme seleção armazenada (sincroniza com Opções)
    try {
        const theme = localStorage.getItem('theme');
        if (theme === 'escuro') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        // mantém sincronizado caso o usuário mude em outra aba
        window.addEventListener('storage', (e) => {
            if (e.key === 'theme') {
                if (e.newValue === 'escuro') document.body.classList.add('dark-theme');
                else document.body.classList.remove('dark-theme');
            }
        });
    } catch (e) {
        // ambiente sem localStorage — ignora
        console.warn('Tema: erro ao ler localStorage', e);
    }
    // intercepta formulários de pagamento e mostra modal de confirmação sem navegar
    // intercepta formulários de pagamento e mostra modal de confirmação sem navegar
    // intercepta formulários de pagamento e mostra modal de confirmação sem navegar
    document.querySelectorAll('.pagamento-ajax-form').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const descricao = formData.get('descricao') || formData.get('valor') || 'seu pedido';

            // Mostrar modal informativo (usa o partial compraConfirmacaoModal)
            const modal = document.getElementById('buyNowModal');
            const titleEl = document.getElementById('buyNowTitle');
            const textEl = document.getElementById('buyNowText');
            const confirmBtn = document.getElementById('buyNowConfirmBtn');
            const cancelBtn = document.getElementById('buyNowCancelBtn');

            if (modal && titleEl && textEl) {
                titleEl.textContent = 'Pedido confirmado';
                textEl.innerHTML = `Seu pedido (<strong>${descricao}</strong>) está a caminho. Ao receber, confirme a entrega no app para avaliá-lo.`;

                // esconder botão "Sim, quero comprar" (não é necessário aqui) e transformar o outro em "Fechar"
                if (confirmBtn) confirmBtn.style.display = 'none';
                if (cancelBtn) {
                    cancelBtn.style.display = 'inline-block';
                    cancelBtn.textContent = 'Fechar';
                }

                modal.style.display = 'flex';
                modal.setAttribute('aria-hidden', 'false');
            }

            // enviar dados ao servidor em background (para registrar/confirmar)
            try {
                await fetch(form.action, {
                    method: (form.method || 'POST').toUpperCase(),
                    body: formData,
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                // não fazemos redirecionamento — resposta ignorada (server deve processar)
            } catch (err) {
                console.error('Erro ao enviar pagamento em background:', err);
            }
        });
    });
});
