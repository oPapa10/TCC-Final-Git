document.getElementById('searchProduto')?.addEventListener('input', function(e) {
    const termo = e.target.value.toLowerCase();
    const select = document.getElementById('produto');
    Array.from(select.options).forEach(option => {
        if (option.value === "") return; // mantém o "Selecione"
        option.style.display = option.text.toLowerCase().includes(termo) ? '' : 'none';
    });
});

document.getElementById('estoqueForm')?.addEventListener('submit', function(e) {
    const produto = document.getElementById('produto').value;
    const quantidade = document.getElementById('quantidade').value;
    if (!produto || !quantidade || quantidade <= 0) {
        e.preventDefault();
        alert('Selecione um produto e informe uma quantidade válida!');
    }
});