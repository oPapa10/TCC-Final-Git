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

console.log('product.js carregado');