// Função principal de pesquisa
function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const productItems = document.querySelectorAll('.product-item');
    const activeCategory = document.querySelector('.btn-category.active')?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1] || '';
    
    let hasResults = false;

    productItems.forEach(item => {
        const productName = item.querySelector('.card-title').textContent.toLowerCase();
        const productDesc = item.querySelector('.card-text').textContent.toLowerCase();
        const productCategory = item.classList[2];
        
        const matchesSearch = searchTerm === '' || 
                            productName.includes(searchTerm) || 
                            productDesc.includes(searchTerm);
        
        const matchesCategory = activeCategory === '' || productCategory === activeCategory;
        
        if (matchesSearch && matchesCategory) {
            item.style.display = 'block';
            hasResults = true;
        } else {
            item.style.display = 'none';
        }
    });

    showNoResultsMessage(!hasResults && searchTerm !== '');
}

// Mostrar mensagem quando não há resultados
function showNoResultsMessage(show) {
    let noResultsMsg = document.getElementById('noResultsMessage');
    
    if (!noResultsMsg) {
        noResultsMsg = document.createElement('div');
        noResultsMsg.id = 'noResultsMessage';
        noResultsMsg.className = 'no-results-message';
        noResultsMsg.textContent = 'Nenhum produto encontrado. Tente outros termos.';
        document.getElementById('produtos').appendChild(noResultsMsg);
    }
    
    noResultsMsg.style.display = show ? 'block' : 'none';
}

// Função de filtro por categoria
function filterProducts(category) {
    // Ativa/desativa o botão
    document.querySelectorAll('.btn-category').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (category !== '') {
        event.target.classList.add('active');
    }
    
    searchProducts();
}

/// Carrinho (array para armazenar os itens)
let cartItems = [];

// Função melhorada para adicionar ao carrinho
function addToCart(name, price, image, event) {
    event.preventDefault();
    
    // Verifica se o item já está no carrinho
    const existingItem = cartItems.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({
            name,
            price,
            image,
            quantity: 1
        });
    }
    
    // Atualiza o carrinho no localStorage
    localStorage.setItem('cart', JSON.stringify(cartItems));
    
    // Mostra mensagem
    showCartMessage();
    
    // Atualiza o contador do carrinho
    updateCartCounter();
}

// Mostra mensagem de produto adicionado
function showCartMessage() {
    const cartMessage = document.getElementById('cartMessage');
    cartMessage.style.display = 'block';
    setTimeout(() => {
        cartMessage.style.display = 'none';
    }, 2000);
}

// Atualiza o contador no ícone do carrinho
function updateCartCounter() {
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    const cartCounter = document.getElementById('cartCounter');
    
    if (cartCounter) {
        cartCounter.textContent = totalItems;
    } else {
        // Cria o contador se não existir
        const cartLink = document.querySelector('a[href="/carrinho"]');
        if (cartLink) {
            const counter = document.createElement('span');
            counter.id = 'cartCounter';
            counter.className = 'cart-counter';
            counter.textContent = totalItems;
            cartLink.appendChild(counter);
        }
    }
}

// Carrega o carrinho ao iniciar a página
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cartItems = JSON.parse(savedCart);
        updateCartCounter();
    }
}

// Adicione ao DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    // ... outros códigos de inicialização
});
// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Adiciona a mensagem de nenhum resultado
    const noResultsMsg = document.createElement('div');
    noResultsMsg.id = 'noResultsMessage';
    noResultsMsg.className = 'no-results-message';
    noResultsMsg.textContent = 'Nenhum produto encontrado. Tente outros termos.';
    document.getElementById('produtos').appendChild(noResultsMsg);
    
    // Event listeners para pesquisa
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('button-search');
    
    // Pesquisa em tempo real com debounce
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(searchProducts, 300);
    });
    
    searchButton.addEventListener('click', searchProducts);
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchProducts();
        }
    });
    
    // Inicializa a exibição de todos os produtos
    searchProducts();
});

// Função para filtrar produtos
function filterProducts(category) {
    var products = document.querySelectorAll('.product-item');
        products.forEach(function (product) {
            if (category === 'Calças' && product.classList.contains('Calças')) {
                product.style.display = 'block';
            } else if (category === 'Calças' && !product.classList.contains('Calças')) {
                product.style.display = 'none';
            } else if (category === 'Capacetes' && product.classList.contains('Capacetes')) {
                product.style.display = 'block';
            } else if (category === 'Capacetes' && !product.classList.contains('Capacetes')) {
                product.style.display = 'none';
            } else if (category === 'Luvas' && product.classList.contains('Luvas')) {
                product.style.display = 'block';
            } else if (category === 'Luvas' && !product.classList.contains('Luvas')) {
                product.style.display = 'none';
             } else if (category === 'Jaquetas' && product.classList.contains('Jaquetas')) {
                product.style.display = 'block';
            } else if (category === 'Jaquetas' && !product.classList.contains('Jaquetas')) {
                product.style.display = 'none';
            } else if (category === 'Motos' && product.classList.contains('Motos')) {
                product.style.display = 'block';
            } else if (category === 'Motos' && !product.classList.contains('Motos')) {
                product.style.display = 'none';
            } else {
                product.style.display = 'block';
            }
        });
    }