let cartItems = [];

// Carrega o produto ao iniciar a página
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    updateCartCounter();
    
    // Carrega os dados do produto do localStorage
    const productData = JSON.parse(localStorage.getItem('currentProduct'));
    
    if (productData) {
        // Preenche os dados na página
        document.querySelector('.product-title').textContent = productData.name;
        document.querySelector('.current-price').textContent = `R$ ${parseFloat(productData.price).toFixed(2).replace('.', ',')}`;
        document.getElementById('mainProductImage').src = productData.image;
        document.querySelector('.product-description').textContent = productData.description;
        
        // Preenche os detalhes
        const detailsList = document.querySelector('.details-list');
        detailsList.innerHTML = '';
        
        JSON.parse(productData.details).forEach(detail => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${detail.split(':')[0]}:</strong>${detail.split(':').slice(1).join(':')}`;
            detailsList.appendChild(li);
        });
        
        // Configura as miniaturas
        const thumbnails = document.querySelectorAll('.thumbnail-item img');
        thumbnails[0].src = productData.image;
        thumbnails[1].src = productData.image;
        thumbnails[2].src = productData.image;
        
        // Remove os dados do localStorage após usar
        localStorage.removeItem('currentProduct');
    }
    
    // Configura o botão de adicionar ao carrinho
    const addToCartBtn = document.querySelector('.btn-add-to-cart');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function(e) {
            addToCart(e);
        });
    }
    
    // Configura os botões de quantidade
    const increaseQty = document.getElementById('increaseQty');
    const decreaseQty = document.getElementById('decreaseQty');
    
    if (increaseQty) {
        increaseQty.addEventListener('click', function() {
            const quantityInput = document.getElementById('productQuantity');
            quantityInput.value = parseInt(quantityInput.value) + 1;
        });
    }
    
    if (decreaseQty) {
        decreaseQty.addEventListener('click', function() {
            const quantityInput = document.getElementById('productQuantity');
            if (parseInt(quantityInput.value) > 1) {
                quantityInput.value = parseInt(quantityInput.value) - 1;
            }
        });
    }
    
    // Configura as miniaturas para trocar a imagem principal
    document.querySelectorAll('.thumbnail-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.thumbnail-item').forEach(thumb => {
                thumb.classList.remove('active');
            });
            this.classList.add('active');
            const newImageSrc = this.querySelector('img').src;
            document.getElementById('mainProductImage').src = newImageSrc;
        });
    });
});

// Função para adicionar ao carrinho
function addToCart(event) {
    if (event) event.preventDefault();
    
    const productData = {
        name: document.querySelector('.product-title').textContent,
        price: parseFloat(document.querySelector('.current-price').textContent.replace('R$ ', '').replace(',', '.')),
        image: document.getElementById('mainProductImage').src,
        description: document.querySelector('.product-description').textContent,
        details: Array.from(document.querySelectorAll('.details-list li')).map(li => li.textContent)
    };
    
    const quantity = parseInt(document.getElementById('productQuantity').value) || 1;
    const existingItem = cartItems.find(item => item.name === productData.name);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cartItems.push({
            ...productData,
            quantity: quantity
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cartItems));
    showCartMessage();
    updateCartCounter();
}

// Mostra mensagem de adicionado ao carrinho
function showCartMessage() {
    const cartMessage = document.getElementById('cartMessage');
    if (cartMessage) {
        cartMessage.style.display = 'block';
        setTimeout(() => {
            cartMessage.style.display = 'none';
        }, 2000);
    }
}

// Atualiza o contador do carrinho
function updateCartCounter() {
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    const cartCounters = document.querySelectorAll('.cart-counter');
    
    cartCounters.forEach(counter => {
        if (totalItems > 0) {
            counter.textContent = totalItems;
            counter.style.display = 'flex';
        } else {
            counter.style.display = 'none';
        }
    });
}

// Carrega o carrinho do localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    cartItems = savedCart ? JSON.parse(savedCart) : [];
    updateCartCounter();
}

// Função para limpar o carrinho (opcional)
function clearCart() {
    cartItems = [];
    localStorage.removeItem('cart');
    updateCartCounter();
}