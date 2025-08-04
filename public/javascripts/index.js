document.addEventListener('DOMContentLoaded', function() {
    // Configuração do carrinho
    let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartCounter();

    // Elementos da mensagem de pesquisa
    const searchMessage = document.getElementById('searchMessage');

    // Filtro de produtos por categoria - FUNÇÃO GLOBAL
window.filterProducts = function(category, clickedButton) {
    // Esconde a mensagem de pesquisa quando filtrar por categoria
    searchMessage.style.display = 'none';
    
    // Remove a classe 'active' de todos os botões de categoria (exceto se for o de "Todos")
    document.querySelectorAll('.btn-category').forEach(btn => {
        if (!btn.textContent.includes("Mostrar Todos")) {
            btn.classList.remove('active');
        }
    });
    
    // Adiciona 'active' apenas ao botão clicado (se não for o de "Todos")
    if (clickedButton && category !== '') {
        clickedButton.classList.add('active');
    }
    
    // Filtra os produtos
    const products = document.querySelectorAll('.product-item');
    products.forEach(product => {
        if (category === '' || product.classList.contains(category)) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
};

    // Configura o clique nos produtos
    //document.querySelectorAll('.product-link').forEach(link => {
      //  link.addEventListener('click', function(e) {
        //    e.preventDefault();
            
          //  const productCard = this.closest('.product-card');
            //const productData = {
              //  name: productCard.dataset.productName,
              //  price: productCard.dataset.productPrice,
              //  originalPrice: productCard.dataset.productOriginalPrice || null,
              //  image: productCard.dataset.productImage,
              //  thumbnails: JSON.parse(productCard.dataset.productThumbnails || '[]'),
              //  description: productCard.dataset.productDescription,
              //  details: JSON.parse(productCard.dataset.productDetails || '[]')
          //  };
            
          //  localStorage.setItem('currentProduct', JSON.stringify(productData));
          //  window.location.href = '/product';
      //  });
  //  });

    // Função para rolar até os produtos
    function scrollToProducts() {
        const produtosSection = document.getElementById('produtos');
        if (produtosSection) {
            produtosSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Barra de pesquisa - FUNÇÃO ATUALIZADA
    document.getElementById('button-search').addEventListener('click', function() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        const products = document.querySelectorAll('.product-item');
        let hasResults = false;
        
        // Esconde a mensagem inicialmente
        searchMessage.style.display = 'none';
        
        products.forEach(product => {
            const card = product.querySelector('.product-card');
            const title = card.querySelector('.card-title').textContent.toLowerCase();
            const description = card.querySelector('.card-text').textContent.toLowerCase();
            
            if (searchTerm === '' || title.includes(searchTerm) || description.includes(searchTerm)) {
                product.style.display = 'block';
                hasResults = true;
            } else {
                product.style.display = 'none';
            }
        });
        
        // Mostra mensagem se não houver resultados e a pesquisa não estiver vazia
        if (!hasResults && searchTerm !== '') {
            searchMessage.style.display = 'block';
        }
        
        // Rola para a seção de produtos
        scrollToProducts();
    });

    // Permitir pesquisa ao pressionar Enter
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('button-search').click();
        }
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

    // Carrossel de promoções
    const promoCarousel = document.getElementById('promoCarousel');
    if (promoCarousel) {
        new bootstrap.Carousel(promoCarousel, {
            interval: 5000,
            wrap: true
        });
    }

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



// Configuração do Carrossel de Promoções - Versão Otimizada
document.addEventListener('DOMContentLoaded', function() {
    const promoCarousel = document.getElementById('promoCarousel');
    if (promoCarousel) {
        new bootstrap.Carousel(promoCarousel, {
            interval: 5000, 
            wrap: true
        });
    }
});