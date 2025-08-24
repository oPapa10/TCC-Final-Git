// Não é necessário JS para cadastro/listagem de categorias.
// Toda a lógica agora é feita pelo backend e renderizada pelo EJS.
// Se quiser, pode adicionar validação simples aqui futuramente.

document.querySelectorAll('.form-excluir-categoria').forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const categoriaId = this.getAttribute('data-categoria-id');
        fetch(`/createCategoria/categorias/tem-produtos/${categoriaId}`)
            .then(res => res.json())
            .then(data => {
                if (data.temProdutos) {
                    alert('Há produtos vinculados a esta categoria. Exclua ou mova os produtos antes de remover a categoria.');
                } else {
                    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
                        this.submit();
                    }
                }
            })
            .catch(() => {
                alert('Erro ao verificar produtos da categoria.');
            });
    });
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
