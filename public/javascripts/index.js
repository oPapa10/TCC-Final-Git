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
    window.updateCartCounter = function() {
        fetch('/carrinho/contador')
          .then(res => res.json())
          .then(data => {
            const cartCounter = document.getElementById('cartCounter');
            if (cartCounter) {
              if (data.total > 0) {
                cartCounter.textContent = data.total;
                cartCounter.style.display = 'flex';
              } else {
                cartCounter.style.display = 'none';
              }
            }
          });
    }

    // Timer das promoções
    function atualizarTimersPromocao() {
        document.querySelectorAll('.promo-timer').forEach(function(timerDiv) {
            const dataFimStr = timerDiv.getAttribute('data-fim');
            if (!dataFimStr) return;
            const dataFim = parseLocalDateTime(dataFimStr);
            if (!dataFim || isNaN(dataFim.getTime())) {
                timerDiv.querySelector('.timer-text').textContent = 'Promoção encerrada!';
                timerDiv.closest('.carousel-item').style.display = 'none';
                return;
            }
            const agora = new Date();
            const diff = dataFim - agora;
            const timerText = timerDiv.querySelector('.timer-text');
            if (diff <= 0) {
                timerText.textContent = 'Promoção encerrada!';
                timerDiv.closest('.carousel-item').style.display = 'none';
            } else {
                const horas = Math.floor(diff / 1000 / 60 / 60);
                const minutos = Math.floor((diff / 1000 / 60) % 60);
                const segundos = Math.floor((diff / 1000) % 60);
                timerText.textContent =
                    (horas > 0 ? `${horas}h ` : '') +
                    (minutos > 0 ? `${minutos}min ` : '') +
                    `${segundos}s restantes`;
            }
        });
    }
    setInterval(atualizarTimersPromocao, 1000); // a cada 1 segundo
    atualizarTimersPromocao();
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

document.addEventListener('DOMContentLoaded', function() {
    const searchMessage = document.getElementById('searchMessage');
    const searchInput = document.getElementById('searchInput');
    const buttonSearch = document.getElementById('button-search');

    // Função para rolar até as categorias/produtos
    function scrollToProducts() {
        const categoriasSection = document.getElementById('categorias') || document.getElementById('produtos');
        if (categoriasSection) {
            categoriasSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Função de pesquisa dinâmica
    function pesquisarProdutos() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const products = document.querySelectorAll('.product-item');
        let hasResults = false;

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

        if (!hasResults && searchTerm !== '') {
            searchMessage.style.display = 'block';
        }
    }

    // Pesquisa dinâmica enquanto digita
    searchInput.addEventListener('input', pesquisarProdutos);

    // Ao clicar na lupa, pesquisa e rola para categorias/produtos
    buttonSearch.addEventListener('click', function() {
        pesquisarProdutos();
        scrollToProducts();
    });

    // Ao pressionar Enter, pesquisa e rola para categorias/produtos
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            pesquisarProdutos();
            scrollToProducts();
        }
    });
});

// Função para atualizar os dados da promoção em tempo real
function atualizarDadosPromocao() {
    document.querySelectorAll('.promo-timer').forEach(function(timerDiv) {
        const dataFimStr = timerDiv.getAttribute('data-fim');
        if (!dataFimStr) return;
        const dataFim = new Date(dataFimStr);
        if (isNaN(dataFim.getTime())) {
            timerDiv.querySelector('.timer-text').textContent = 'Promoção encerrada!';
            timerDiv.closest('.carousel-item').style.display = 'none';
            return;
        }
        const agora = new Date();
        const diff = dataFim - agora;
        const timerText = timerDiv.querySelector('.timer-text');
        if (diff <= 0) {
            timerText.textContent = 'Promoção encerrada!';
            timerDiv.closest('.carousel-item').style.display = 'none';
        } else {
            const totalSegundos = Math.floor(diff / 1000);
            const dias = Math.floor(totalSegundos / (60 * 60 * 24));
            const horas = Math.floor((totalSegundos % (60 * 60 * 24)) / (60 * 60));
            const minutos = Math.floor((totalSegundos % (60 * 60)) / 60);
            const segundos = totalSegundos % 60;

            if (dias > 0) {
                timerText.textContent = `${dias} Dias ${horas} Horas`;
            } else if (horas > 0) {
                timerText.textContent = `${horas} Horas ${minutos} Minutos`;
            } else if (minutos > 0) {
                timerText.textContent = `${minutos} Minutos`;
            } else {
                timerText.textContent = `${segundos} Segundos`;
            }
        }
    });
}

// Atualiza ao carregar a página
document.addEventListener('DOMContentLoaded', atualizarDadosPromocao);

// Atualiza a cada segundo
setInterval(atualizarDadosPromocao, 1000);

// Converte "YYYY-MM-DDTHH:mm:ss" para data local corretamente
function parseLocalDateTime(str) {
    // str: "2024-07-01T15:00:00"
    const [datePart, timePart] = str.split('T');
    if (!datePart || !timePart) return null;
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute, second || 0);
}

// Arraste horizontal nas categorias
document.addEventListener('DOMContentLoaded', function() {
    const categorias = document.getElementById('categorias-scroll');
    if (!categorias) return;
    let isDown = false;
    let startX, scrollLeft;

    categorias.addEventListener('mousedown', (e) => {
        isDown = true;
        categorias.classList.add('dragging');
        startX = e.pageX - categorias.offsetLeft;
        scrollLeft = categorias.scrollLeft;
    });
    categorias.addEventListener('mouseleave', () => {
        isDown = false;
        categorias.classList.remove('dragging');
    });
    categorias.addEventListener('mouseup', () => {
        isDown = false;
        categorias.classList.remove('dragging');
    });
    categorias.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - categorias.offsetLeft;
        const walk = (x - startX) * 1.5;
        categorias.scrollLeft = scrollLeft - walk;
    });

    // Touch para mobile
    categorias.addEventListener('touchstart', (e) => {
        isDown = true;
        startX = e.touches[0].pageX - categorias.offsetLeft;
        scrollLeft = categorias.scrollLeft;
    });
    categorias.addEventListener('touchend', () => {
        isDown = false;
    });
    categorias.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const x = e.touches[0].pageX - categorias.offsetLeft;
        const walk = (x - startX) * 1.5;
        categorias.scrollLeft = scrollLeft - walk;
    });
});

(function() {
    // Habilita clique no slide da promoção em mobile para navegar ao produto/página
    function isMobileView() {
        return window.innerWidth <= 768;
    }

    function attachPromoMobileClick() {
        const promoCarousel = document.getElementById('promoCarousel');
        if (!promoCarousel) return;
        const items = promoCarousel.querySelectorAll('.carousel-item');

        items.forEach(item => {
            if (item.dataset.mobileClickAdded) return;

            const handler = function(e) {
                // só age em mobile
                if (!isMobileView()) return;

                // não ativar ao clicar em controles, indicadores ou elementos interativos
                if (e.target.closest('.carousel-control-prev, .carousel-control-next, .carousel-indicators, a, button, input, select, textarea')) {
                    return;
                }

                // procura por link/atributo com destino dentro do slide
                let url = null;
                const linkSelectors = ['a.promo-button[href]', 'a[href]', '[data-href]'];
                for (const s of linkSelectors) {
                    const found = item.querySelector(s);
                    if (found) {
                        url = found.getAttribute('href') || found.dataset.href || found.getAttribute('data-href');
                        if (url) break;
                    }
                }

                // tentar atributo direto do item: data-href / data-url
                if (!url) {
                    url = item.dataset.href || item.dataset.url || item.getAttribute('data-href') || item.getAttribute('data-url');
                }

                // se achou URL, navega
                if (url) {
                    // evita múltiplos eventos rápidos
                    window.location.href = url;
                }
            };

            item.addEventListener('click', handler);
            item.dataset.mobileClickAdded = '1';
        });
    }

    // inicializa ao carregar e reaplica no resize (debounce simples)
    document.addEventListener('DOMContentLoaded', attachPromoMobileClick);
    let resizeTimer = null;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(attachPromoMobileClick, 200);
    });
})();