// Carregar carrinho do localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

const cartContainer = document.getElementById('cart-container');
const totalDisplay = document.getElementById('total');

// Função para formatar preços no padrão brasileiro
function formatPrice(price) {
    return price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// Função para atualizar o total
function updateTotal() {
    let total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    totalDisplay.innerText = formatPrice(total);
}

// Função para renderizar o carrinho
function renderCart() {
    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="cart-empty">
                <img src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png" alt="Carrinho vazio">
                <p>Seu carrinho está vazio</p>
                <a href="/" class="cart-continue-btn">Voltar às compras</a>
            </div>
        `;
        document.querySelector('.cart-summary').style.display = 'none';
        return;
    }
    
    document.querySelector('.cart-summary').style.display = 'block';
    
    cartContainer.innerHTML = '';
    cart.forEach((item, index) => {
        const cartItemDiv = document.createElement('div');
        cartItemDiv.classList.add('cart-item');
        cartItemDiv.innerHTML = `
            <div class="item-details">
                <img src="${item.image}" class="item-image" alt="${item.name}">
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">${formatPrice(item.price)}</div>
                </div>
            </div>
            <div class="item-quantity">
                <button class="quantity-btn decrease-quantity">-</button>
                <input type="text" value="${item.quantity}" class="quantity-input" disabled>
                <button class="quantity-btn increase-quantity">+</button>
            </div>
            <button class="remove-btn">Remover</button>
        `;
        
        // Event listeners para os botões de quantidade
        cartItemDiv.querySelector('.increase-quantity').addEventListener('click', () => {
            item.quantity++;
            updateCart();
        });
        
        cartItemDiv.querySelector('.decrease-quantity').addEventListener('click', () => {
            if (item.quantity > 1) {
                item.quantity--;
                updateCart();
            }
        });
        
        cartContainer.appendChild(cartItemDiv);
    });
}

// Função para remover produto usando delegação de eventos
cartContainer.addEventListener("click", (event) => {
    if (event.target.classList.contains("remove-btn")) {
        const itemDiv = event.target.closest(".cart-item");
        const itemIndex = Array.from(cartContainer.children).indexOf(itemDiv);
        
        if (itemIndex !== -1) {
            cart.splice(itemIndex, 1);
            updateCart();
        }
    }
});

// Função para salvar e atualizar o carrinho
function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateTotal();
    
    // Atualiza o contador no menu superior (se existir)
    const cartCounter = document.getElementById('cartCounter');
    if (cartCounter) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCounter.textContent = totalItems;
        cartCounter.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// Inicializa o carrinho
renderCart();
updateTotal();