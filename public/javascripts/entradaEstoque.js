document.getElementById('searchProduto')?.addEventListener('input', function(e) {
    const termo = e.target.value.toLowerCase();
    const select = document.getElementById('produto');
    Array.from(select.options).forEach(option => {
        if (option.value === "") return;
        option.style.display = option.text.toLowerCase().includes(termo) ? '' : 'none';
    });
});

document.getElementById('quantidade')?.addEventListener('input', function(e) {
    const novoEstoque = document.getElementById('novoEstoque');
    if (this.value && Number(this.value) > 0) {
        novoEstoque.value = '';
        novoEstoque.disabled = true;
    } else {
        novoEstoque.disabled = false;
    }
});
document.getElementById('novoEstoque')?.addEventListener('input', function(e) {
    const quantidade = document.getElementById('quantidade');
    if (this.value && Number(this.value) >= 0) {
        quantidade.value = '';
        quantidade.disabled = true;
    } else {
        quantidade.disabled = false;
    }
});

document.getElementById('estoqueForm')?.addEventListener('submit', function(e) {
    const produto = document.getElementById('produto').value;
    const quantidade = document.getElementById('quantidade').value;
    const novoEstoque = document.getElementById('novoEstoque').value;
    if (!produto) {
        e.preventDefault();
        alert('Selecione um produto!');
        return;
    }
    if ((!quantidade || Number(quantidade) <= 0) && (novoEstoque === '' || Number(novoEstoque) < 0)) {
        e.preventDefault();
        alert('Informe uma quantidade a adicionar ou um novo valor de estoque!');
        return;
    }
});