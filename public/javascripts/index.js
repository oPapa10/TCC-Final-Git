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

// Carrossel de Produtos
let count = 1;
document.getElementById("radio1").checked = true;

setInterval(function() {
    nextImage();
}, 10000);

function nextImage() {
    count++;
    if(count > 4){
        count = 1;
    }
    document.getElementById("radio" + count).checked = true;
}

// Função para adicionar ao carrinho com LocalStorage
function addToCart(productName, productPrice, productImage, event) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    let productIndex = cart.findIndex(item => item.name === productName);

    if (productIndex === -1) {
        cart.push({ name: productName, price: productPrice, image: productImage, quantity: 1 });
    } else {
        cart[productIndex].quantity += 1;
    }

    localStorage.setItem('cart', JSON.stringify(cart));

    // Exibir mensagem de confirmação
    let mensagem = document.getElementById("cartMessage");
    mensagem.innerText = `${productName} foi adicionado ao carrinho!`;
    mensagem.style.display = "block";

    // Adiciona um fundo clicável para fechar a mensagem
    let backdrop = document.createElement("div");
    backdrop.style.position = "fixed";
    backdrop.style.top = "0";
    backdrop.style.left = "0";
    backdrop.style.width = "100%";
    backdrop.style.height = "100%";
    backdrop.style.backgroundColor = "rgba(0,0,0,0.2)";
    backdrop.style.zIndex = "999";
    backdrop.style.cursor = "pointer";
    document.body.appendChild(backdrop);

    // Remove a mensagem e o fundo ao clicar em qualquer lugar
    backdrop.addEventListener("click", function () {
        mensagem.style.display = "none";
        backdrop.remove();
    });

    // Impede que o clique leve para o topo da página
    if (event) {
        event.preventDefault();
    }
}
