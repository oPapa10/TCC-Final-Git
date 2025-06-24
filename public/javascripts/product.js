let cartItems = JSON.parse(localStorage.getItem('cart')) || [];

// Carrega o produto ao iniciar a página
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    updateCartCounter();
    
    // Carrega os dados do produto do localStorage
    const productData = JSON.parse(localStorage.getItem('currentProduct'));
    
    if (productData) {
        // Preenche os dados na página
        document.querySelector('.product-title').textContent = productData.name;
        
        // Formata preço atual
        const currentPrice = parseFloat(productData.price).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
        document.querySelector('.current-price').textContent = currentPrice;
        
        // Imagem principal
        document.getElementById('mainProductImage').src = productData.image;
        document.querySelector('.product-description').textContent = productData.description;
        
        // Preço original (se houver)
        if (productData.originalPrice) {
            const originalPrice = parseFloat(productData.originalPrice).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
            document.querySelector('.original-price').textContent = originalPrice;
            document.querySelector('.original-price').style.textDecoration = 'line-through';
            
            // Calcula e mostra o desconto
            const discount = Math.round(100 - (parseFloat(productData.price) / parseFloat(productData.originalPrice) * 100));
            document.querySelector('.discount-badge').textContent = `${discount}% OFF`;
        } else {
            document.querySelector('.original-price').style.display = 'none';
            document.querySelector('.discount-badge').style.display = 'none';
        }
        
        // Preenche os detalhes
        const detailsList = document.querySelector('.details-list');
        detailsList.innerHTML = '';
        
        productData.details.forEach(detail => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${detail.split(':')[0]}:</strong>${detail.split(':').slice(1).join(':')}`;
            detailsList.appendChild(li);
        });
        
        // Configura as miniaturas
        const thumbnails = document.querySelectorAll('.thumbnail-item img');
        
        // Verifica se há miniaturas específicas para o produto
        if (productData.thumbnails && productData.thumbnails.length > 0) {
            // Remove a classe 'active' de todas as miniaturas primeiro
            document.querySelectorAll('.thumbnail-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Atualiza as imagens das miniaturas
            productData.thumbnails.forEach((thumbSrc, index) => {
                if (thumbnails[index]) {
                    thumbnails[index].src = thumbSrc;
                    // Ativa a primeira miniatura por padrão
                    if (index === 0) {
                        thumbnails[index].parentElement.classList.add('active');
                    }
                }
            });
            
            // Esconde miniaturas extras se o produto tiver menos que 3 imagens
            for (let i = productData.thumbnails.length; i < thumbnails.length; i++) {
                thumbnails[i].parentElement.style.display = 'none';
            }
        } else {
            // Se não houver miniaturas específicas, usa a imagem principal para todas
            thumbnails[0].src = productData.image;
            thumbnails[1].src = productData.image;
            thumbnails[2].src = productData.image;
        }
        
        localStorage.removeItem('currentProduct');
        updateTotalPrice(); // Atualiza o preço total inicial
    }
    
    // Configura o botão de adicionar ao carrinho
    document.querySelector('.btn-add-to-cart').addEventListener('click', addToCart);
    
    // Configura os botões de quantidade
    document.getElementById('increaseQty').addEventListener('click', function() {
        const quantityInput = document.getElementById('productQuantity');
        quantityInput.value = parseInt(quantityInput.value) + 1;
        updateTotalPrice();
    });
    
    document.getElementById('decreaseQty').addEventListener('click', function() {
        const quantityInput = document.getElementById('productQuantity');
        if (parseInt(quantityInput.value) > 1) {
            quantityInput.value = parseInt(quantityInput.value) - 1;
            updateTotalPrice();
        }
    });
    
    // Atualiza ao mudar valor manualmente
    document.getElementById('productQuantity').addEventListener('input', function() {
        if (parseInt(this.value) < 1) this.value = 1;
        updateTotalPrice();
    });
    
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

// Função para calcular e atualizar o preço total
function updateTotalPrice() {
    const quantity = parseInt(document.getElementById('productQuantity').value) || 1;
    const priceText = document.querySelector('.current-price').textContent;
    
    // Extrai o valor numérico do preço formatado
    const numericPrice = parseFloat(
        priceText.replace(/[^\d,]/g, '') // Remove tudo exceto números e vírgula
                .replace(',', '.')       // Substitui vírgula por ponto
    );
    
    const total = (numericPrice * quantity).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    
    document.getElementById('totalPrice').textContent = total.split('R$')[1].trim();
    
    // Efeito visual
    const totalContainer = document.querySelector('.total-price-container');
    totalContainer.classList.add('pulse');
    setTimeout(() => totalContainer.classList.remove('pulse'), 500);
}

// Função para adicionar ao carrinho
function addToCart(event) {
    if (event) event.preventDefault();
    
    const productData = {
        name: document.querySelector('.product-title').textContent,
        price: parseFloat(
            document.querySelector('.current-price').textContent
                .replace(/[^\d,]/g, '')
                .replace(',', '.')
        ),
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
    const cartCounter = document.getElementById('cartCounter');
    
    if (totalItems > 0) {
        cartCounter.textContent = totalItems;
        cartCounter.style.display = 'flex';
    } else {
        cartCounter.style.display = 'none';
    }
}

// Carrega o carrinho do localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    cartItems = savedCart ? JSON.parse(savedCart) : [];
    updateCartCounter();
}