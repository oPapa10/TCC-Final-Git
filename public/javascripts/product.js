document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('addToCartForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const form = this;
        const formData = new FormData(form);
        console.log('produtoId:', formData.get('produtoId'));
        console.log('quantidade:', formData.get('quantidade'));
        
        const params = new URLSearchParams();
        params.append('produtoId', form.produtoId.value);
        params.append('quantidade', form.quantidade.value);

        fetch(form.action, {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(async res => {
            let data;
            try {
                data = await res.json();
            } catch {
                data = { success: false, message: 'Erro inesperado ao adicionar ao carrinho.' };
            }
            return data;
        })
        .then(data => {
            if (data.success) {
                if (typeof data.quantidade !== 'undefined') {
                    form.quantidade.value = data.quantidade;
                }
                document.getElementById('cartMessage').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('cartMessage').style.display = 'none';
                }, 1500);
            } else {
                // Opcional: mostrar mensagem amigável
                alert(data.message || 'Erro ao adicionar ao carrinho!');
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
  // ✅ CONTROLE DE QUANTIDADE
  const quantidadeInput = document.getElementById('quantidadeInput');
  const btnMaisQtd = document.getElementById('btnMaisQtd');
  const btnMenosQtd = document.getElementById('btnMenosQtd');

  if (btnMaisQtd) {
    btnMaisQtd.addEventListener('click', (e) => {
      e.preventDefault();
      quantidadeInput.value = Math.max(1, Number(quantidadeInput.value) + 1);
    });
  }

  if (btnMenosQtd) {
    btnMenosQtd.addEventListener('click', (e) => {
      e.preventDefault();
      quantidadeInput.value = Math.max(1, Number(quantidadeInput.value) - 1);
    });
  }

  // ✅ COMPRAR AGORA - com quantidade
  const btnComprarAgora = document.getElementById('btnComprarAgora');
  if (btnComprarAgora) {
    btnComprarAgora.addEventListener('click', (e) => {
      e.preventDefault();
      const produtoId = document.querySelector('input[name="produtoId"]')?.value;
      const quantidade = Number(quantidadeInput.value) || 1;
      
      if (produtoId) {
        window.location.href = `/pagamento?produtoId=${produtoId}&quantidade=${quantidade}`;
      }
    });
  }

  // ✅ ADICIONAR AO CARRINHO - com quantidade
  const btnAdicionarCarrinho = document.getElementById('btnAdicionarCarrinho');
  if (btnAdicionarCarrinho) {
    btnAdicionarCarrinho.addEventListener('click', async (e) => {
      e.preventDefault();
      const produtoId = document.querySelector('input[name="produtoId"]')?.value;
      const quantidade = Number(quantidadeInput.value) || 1;

      if (!produtoId) {
        alert('Produto não encontrado');
        return;
      }

      try {
        const resp = await fetch('/carrinho/adicionar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ produtoId: Number(produtoId), quantidade })
        });

        const json = await resp.json();
        if (json.success) {
          alert(`${json.produtoNome} adicionado ao carrinho (Qtd: ${quantidade})!`);
          // Reseta quantidade para 1 após adicionar
          quantidadeInput.value = 1;
        } else {
          alert(json.message || 'Erro ao adicionar ao carrinho');
        }
      } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao adicionar ao carrinho: ' + err.message);
      }
    });
  }
});

console.log('product.js carregado');