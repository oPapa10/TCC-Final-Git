document.getElementById('categoryName')?.addEventListener('input', function() {
    // Remove espaços no início/fim e múltiplos espaços entre palavras
    this.value = this.value.replace(/^\s+|\s+$/g, '').replace(/\s{2,}/g, ' ');
});

// Função para validar nome de categoria
function nomeCategoriaValido(nome) {
    // Aceita apenas letras (com acento), números e espaços entre palavras (não permite espaço no início/fim ou duplo)
    return /^[A-Za-zÀ-ÿ0-9]+( [A-Za-zÀ-ÿ0-9]+)*$/.test(nome.trim());
}

// CREATE
document.getElementById('categoryForm')?.addEventListener('submit', function(e) {
    const nome = document.getElementById('categoryName').value;
    if (!nomeCategoriaValido(nome)) {
        e.preventDefault();
        alert('O nome da categoria não pode conter caracteres especiais. Use apenas letras, números e espaços.');
    }
});

// EDIT
document.querySelector('form[action*="categorias/editar"]')?.addEventListener('submit', function(e) {
    const nome = document.getElementById('categoryName').value;
    if (!nomeCategoriaValido(nome)) {
        e.preventDefault();
        alert('O nome da categoria não pode conter caracteres especiais. Use apenas letras, números e espaços.');
    }
});