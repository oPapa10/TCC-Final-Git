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

    // Aplica tema
    try {
        const theme = localStorage.getItem('theme');
        if (theme === 'escuro') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    } catch (e) {
        console.warn('Tema: erro ao ler localStorage', e);
    }

    // ✅ CRIA LOADER (oculto por padrão)
    const loaderHTML = `
        <div id="pagamentoLoader" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;align-items:center;justify-content:center;">
            <div style="background:white;padding:40px;border-radius:12px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,0.3)">
                <div style="margin-bottom:20px">
                    <div style="width:50px;height:50px;border:4px solid #f3f3f3;border-top:4px solid #0b5ed7;border-radius:50%;margin:0 auto;animation:spin 1s linear infinite"></div>
                </div>
                <p style="color:#333;font-size:16px;margin:0">Processando seu pedido...</p>
                <p style="color:#666;font-size:13px;margin-top:8px">Isso pode levar alguns segundos</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', loaderHTML);

    // ✅ INTERCEPTA FORMULÁRIO DE PAGAMENTO COM PIX
    const formPix = document.querySelector('form[action="/pagamento/compraConfirmacao"]');
    
    if (formPix) {
        formPix.addEventListener('submit', async (e) => {
            e.preventDefault();

            // ✅ MOSTRA LOADER
            const loader = document.getElementById('pagamentoLoader');
            if (loader) {
                loader.style.display = 'flex';  // ✅ MUDE PARA FLEX AQUI
            }

            // ✅ COLETA DADOS MANUALMENTE E ENVIA COMO JSON
            const valor = formPix.querySelector('input[name="valor"]').value;
            const descricao = formPix.querySelector('input[name="descricao"]').value;
            
            // Coleta todos os itensArray
            const itensArray = [];
            const produtoInputs = formPix.querySelectorAll('input[name*="itensArray"]');
            const indices = new Set();
            
            produtoInputs.forEach(inp => {
                const match = inp.name.match(/itensArray\[(\d+)\]/);
                if (match) indices.add(parseInt(match[1]));
            });

            indices.forEach(idx => {
                const produtoId = formPix.querySelector(`input[name="itensArray[${idx}][produtoId]"]`)?.value;
                const quantidade = formPix.querySelector(`input[name="itensArray[${idx}][quantidade]"]`)?.value;
                if (produtoId) {
                    itensArray.push({ produtoId, quantidade });
                }
            });

            console.log('[DEBUG] Dados a enviar:', { valor, descricao, itensArray });

            try {
                const resp = await fetch(formPix.action, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ valor, descricao, itensArray })
                });

                const json = await resp.json();
                console.log('[DEBUG] Resposta:', json);

                if (json.success && json.redirect) {
                    // ✅ AGUARDA 1 SEGUNDO ANTES DE REDIRECIONAR
                    setTimeout(() => {
                        window.location.href = json.redirect;
                    }, 1000);
                } else {
                    // ❌ ESCONDE LOADER SE ERRO
                    if (loader) {
                        loader.style.display = 'none';
                    }
                    alert(json.message || json.error || 'Erro ao processar pedido');
                }
            } catch (err) {
                // ❌ ESCONDE LOADER SE ERRO
                if (loader) {
                    loader.style.display = 'none';
                }
                console.error('[DEBUG] Erro:', err);
                alert('Erro ao processar pedido: ' + err.message);
            }
        });
    }

    const baseItensHtml = itens.map(it => {
        const imagemBase64 = imageToBase64(it.imagem) || imageToBase64(`/uploads/${path.basename(it.imagem || '')}`) || null;
        const imgHtml = imagemBase64
          ? `<img src="${imagemBase64}" alt="${(it.nome||'Produto')}" style="width:88px;height:88px;object-fit:cover;border-radius:6px;border:1px solid #e6e6e6">`
          : `<div style="width:88px;height:88px;background:#f3f4f6;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:12px">Sem imagem</div>`;

        // ✅ MOSTRA PREÇO COM DESCONTO
        const precoHtml = it.precoOriginal 
          ? `<div style="font-size:12px;color:#999"><s>R$ ${(Number(it.precoOriginal)).toLocaleString('pt-BR',{minimumFractionDigits:2})}</s></div><div style="color:#28a745;font-weight:600">R$ ${(Number(it.precoUnitario)).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>`
          : `R$ ${(Number(it.precoUnitario||0)).toLocaleString('pt-BR',{minimumFractionDigits:2})}`;

        return `<tr>
          <td style="padding:12px;border-bottom:1px solid #f1f1f1;vertical-align:middle;width:100px">${imgHtml}</td>
          <td style="padding:12px;border-bottom:1px solid #f1f1f1;vertical-align:middle">
            <div style="font-size:14px;color:#111;font-weight:600;margin-bottom:6px">${(it.nome||'Produto')}</div>
            <div style="font-size:13px;color:#6b7280">Qtd: ${Number(it.quantidade||1)}</div>
          </td>
          <td style="padding:12px;border-bottom:1px solid #f1f1f1;vertical-align:middle;text-align:right;color:#111;font-weight:600">${precoHtml}</td>
          <td style="padding:12px;border-bottom:1px solid #f1f1f1;vertical-align:middle;text-align:right;color:#111;font-weight:700">R$ ${(Number(it.lineTotal|| (it.precoUnitario*it.quantidade) )).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
        </tr>`;
      }).join('\n');
});
