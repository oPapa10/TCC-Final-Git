
// Código temporário para carregar o carrinho
document.addEventListener('DOMContentLoaded', function() {
    const savedCart = localStorage.getItem('cart');
    const cartItems = savedCart ? JSON.parse(savedCart) : [];
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    const cartCounter = document.getElementById('cartCounter');
    
    if (cartCounter) {
        if (totalItems > 0) {
            cartCounter.textContent = totalItems;
            cartCounter.style.display = 'flex';
        } else {
            cartCounter.style.display = 'none';
        }
    }
});