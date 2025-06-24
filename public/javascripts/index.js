/*CARROSSEL DE PRODUTOS*/

let count = 1;
document.getElementById("radio1").checked = true;

setInterval( function(){
    nextImage();
}, 10000)

function nextImage(){
    count++;
    if(count>4){
        count = 1;
    }

    document.getElementById("radio"+count).checked = true;

}

/* FIM DO CARROSSEL DE PRODUTOS */


/*Script para Filtragem de Produtos*/

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

// Função para adicionar ao carrinho com LocalStorage
    function addToCart(productName, productPrice, productImage) {
        // Obter o carrinho do localStorage ou criar um novo carrinho
        let cart = JSON.parse(localStorage.getItem('cart')) || [];

        // Verificar se o produto já existe no carrinho
        let productIndex = cart.findIndex(item => item.name === productName);

        if (productIndex === -1) {
            // Produto não existe no carrinho, adicionar
            cart.push({ name: productName, price: productPrice, image: productImage, quantity: 1 });
        } else {
            // Produto já existe, aumentar a quantidade
            cart[productIndex].quantity += 1;
        }

        // Salvar o carrinho de volta no localStorage
        localStorage.setItem('cart', JSON.stringify(cart));

        alert(`${productName} foi adicionado ao carrinho por R$ ${productPrice.toFixed(2)}.`);
    }

/*Fim da Filtragem de Produtos*/

