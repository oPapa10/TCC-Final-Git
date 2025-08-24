// Mostra o nome do arquivo selecionado com estilo
document.getElementById('imagem')?.addEventListener('change', function(e) {
    const fileName = e.target.files[0]?.name || 'Nenhum arquivo selecionado';
    const fileText = document.querySelector('.file-input-text');
    if (fileText) {
        fileText.textContent = fileName;
        fileText.style.fontWeight = '600';
        fileText.style.color = '#4361ee';
        fileText.parentElement.style.borderColor = '#4361ee';
        fileText.parentElement.style.backgroundColor = '#f0f4ff';
        fileText.parentElement.querySelector('i').style.color = '#7209b7';
    }
});