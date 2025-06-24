// Função principal de pesquisa
function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const productItems = document.querySelectorAll('.product-item');
    const activeCategory = document.querySelector('.btn-category.active')?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1] || '';
    
    let hasResults = false;

    productItems.forEach(item => {
        const productName = item.querySelector('.card-title').textContent.toLowerCase();
        const productCategory = item.classList[2];

        const matchesSearch = searchTerm === '' || productName.includes(searchTerm);
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
    document.querySelectorAll('.btn-category').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (category !== '') {
        event.target.classList.add('active');
    }
    
    searchProducts();
}

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Cria a mensagem de nenhum resultado
    const noResultsMsg = document.createElement('div');
    noResultsMsg.id = 'noResultsMessage';
    noResultsMsg.className = 'no-results-message';
    noResultsMsg.textContent = 'Nenhum produto encontrado. Tente outros termos.';
    document.getElementById('produtos').appendChild(noResultsMsg);

    // Adiciona evento de clique nos links dos produtos
    document.querySelectorAll('.product-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const productCard = this.closest('.card');
            const productData = {
                name: productCard.dataset.productName,
                price: productCard.dataset.productPrice,
                image: productCard.dataset.productImage,
                description: productCard.dataset.productDescription,
                details: productCard.dataset.productDetails
            };
            
            // Salva os dados do produto no localStorage antes de redirecionar
            localStorage.setItem('currentProduct', JSON.stringify(productData));
            window.location.href = this.getAttribute('href');
        });
    });

    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('button-search');

    // Pesquisa em tempo real com debounce
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(searchProducts, 300);
    });

    // Clique no botão de pesquisa
    searchButton.addEventListener('click', function() {
        searchProducts();

        // Scroll para a seção de produtos
        const produtosSection = document.getElementById('produtos');
        if (produtosSection) {
            produtosSection.scrollIntoView({ behavior: 'smooth' });
        }
    });

    // Enter na barra de pesquisa
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchProducts();
        }
    });

    // Inicializa exibindo os produtos
    searchProducts();
});

// Função para filtrar produtos
function filterProducts(category) {
    var products = document.querySelectorAll('.product-item');
    products.forEach(function (product) {
        if (category === '' || product.classList.contains(category)) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}

// Carrossel de produtos
document.addEventListener('DOMContentLoaded', function() {
    const carousel = new bootstrap.Carousel('#productCarousel', {
        interval: 7000
    });

    document.getElementById('productCarousel').addEventListener('slid.bs.carousel', function(e) {
        document.querySelectorAll('.info-content').forEach((el, index) => {
            el.classList.toggle('active', index === e.to);
        });
    });

    document.querySelectorAll('.carousel-indicators button').forEach(button => {
        button.addEventListener('click', function() {
            const slideTo = parseInt(this.getAttribute('data-bs-slide-to'));
            carousel.to(slideTo);
        });
    });
});