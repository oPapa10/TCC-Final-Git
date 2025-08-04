document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('addToCartForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new URLSearchParams(new FormData(form));
            fetch('/carrinho/adicionar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            })
            .then(res => {
                if (res.ok) {
                    const msg = document.getElementById('cartMessage');
                    if (msg) {
                        msg.style.display = 'block';
                        msg.textContent = 'Produto adicionado ao carrinho!';
                        setTimeout(() => { msg.style.display = 'none'; }, 2000);
                    }
                    if (window.updateCartCounter) window.updateCartCounter();
                } else {
                    alert('Erro ao adicionar ao carrinho!');
                }
            })
            .catch(() => alert('Erro ao adicionar ao carrinho!'));
        });
    }
});