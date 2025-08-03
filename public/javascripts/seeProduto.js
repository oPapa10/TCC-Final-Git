document.getElementById('searchProduto')?.addEventListener('input', function(e) {
    const termo = e.target.value.toLowerCase();
    document.querySelectorAll('.table tbody tr').forEach(row => {
        const texto = row.innerText.toLowerCase();
        row.style.display = texto.includes(termo) ? '' : 'none';
    });
});