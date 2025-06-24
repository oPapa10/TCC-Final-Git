document.addEventListener('DOMContentLoaded', function() {
    // Configuração do carrinho
    let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartCounter();

    // Filtro de produtos por categoria
    function filterProducts(category) {
        const products = document.querySelectorAll('.product-item');
        products.forEach(product => {
            if (category === '' || product.classList.contains(category)) {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        });
    }

    // Configura o clique nos produtos
    document.querySelectorAll('.product-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const productCard = this.closest('.product-card');
            const productData = {
                name: productCard.dataset.productName,
                price: productCard.dataset.productPrice,
                originalPrice: productCard.dataset.productOriginalPrice || null,
                image: productCard.dataset.productImage,
                thumbnails: JSON.parse(productCard.dataset.productThumbnails || '[]'),
                description: productCard.dataset.productDescription,
                details: JSON.parse(productCard.dataset.productDetails)
            };
            
            localStorage.setItem('currentProduct', JSON.stringify(productData));
            window.location.href = '/product';
        });
    });

    // Barra de pesquisa
    document.getElementById('button-search').addEventListener('click', function() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const products = document.querySelectorAll('.product-card');
        
        products.forEach(product => {
            const title = product.querySelector('.card-title').textContent.toLowerCase();
            const description = product.querySelector('.card-text').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                product.closest('.product-item').style.display = 'block';
            } else {
                product.closest('.product-item').style.display = 'none';
            }
        });
    });

    // Carrossel de produtos
    const carousel = new bootstrap.Carousel(document.getElementById('productCarousel'), {
        interval: 5000,
        wrap: true
    });

    // Atualiza as informações conforme o carrossel muda
    document.getElementById('productCarousel').addEventListener('slid.bs.carousel', function(e) {
        const infoContents = document.querySelectorAll('.info-content');
        infoContents.forEach(content => content.classList.remove('active'));
        infoContents[e.to].classList.add('active');
    });

    // Função para atualizar o contador do carrinho
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
});