// Carregar carrinho do localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

const cartContainer = document.getElementById('cart-container');
const totalDisplay = document.getElementById('total');

// Função para atualizar o total
function updateTotal() {
    let total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    totalDisplay.innerText = total.toFixed(2);
}

// Função para renderizar o carrinho
function renderCart() {
    cartContainer.innerHTML = '';
    cart.forEach((item, index) => {
        const cartItemDiv = document.createElement('div');
        cartItemDiv.classList.add('cart-item');
        cartItemDiv.innerHTML = `
            <div class="item-details">
                <img src="${item.image}" class="item-image" alt="${item.name}">
                <div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-quantity">
                        <button class="decrease-quantity btn btn-sm btn-secondary">-</button>
                        <input type="text" value="${item.quantity}" class="quantity-input" disabled>
                        <button class="increase-quantity btn btn-sm btn-secondary">+</button>
                    </div>
                </div>
            </div>
            <button class="remove-btn">Remover</button>
        `;
        
        // Lógica de aumentar a quantidade
        cartItemDiv.querySelector('.increase-quantity').addEventListener('click', () => {
            item.quantity++;
            updateCart();
        });
        
        // Lógica de diminuir a quantidade
        cartItemDiv.querySelector('.decrease-quantity').addEventListener('click', () => {
            if (item.quantity > 1) {
                item.quantity--;
                updateCart();
            }
        });
        
        // Lógica para remover o item
        cartItemDiv.querySelector('.remove-btn').addEventListener('click', () => {
            cart.splice(index, 1);
            updateCart();
        });
        
        cartContainer.appendChild(cartItemDiv);
    });
}

// Função para salvar o carrinho no localStorage
function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateTotal();
}

renderCart();
updateTotal();