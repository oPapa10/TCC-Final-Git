// Mostra o nome do arquivo selecionado com estilo
document.getElementById('imagemFile')?.addEventListener('change', function(e) {
    const fileName = e.target.files[0]?.name || 'Nenhum arquivo selecionado';
    const fileInput = this;
    const parent = fileInput.closest('.file-input');
    
    if (parent) {
        parent.style.borderColor = '#4361ee';
        parent.style.background = 'rgba(67, 97, 238, 0.05)';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const imagemFile = document.getElementById('imagemFile');
    const imagemLink = document.getElementById('imagemLink');
    const previewMainImage = document.getElementById('previewMainImage');
    const thumbnailUpload = document.getElementById('thumbnailUpload');
    const thumbnailLinks = document.getElementById('thumbnailLinks');
    const thumbsList = document.getElementById('thumbsList');

    // Preview imagem principal ao escolher arquivo
    imagemFile?.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) {
            const url = URL.createObjectURL(f);
            if (previewMainImage) {
                previewMainImage.src = url;
                previewMainImage.className = 'current-image';
            }
            // Desabilita link
            if (imagemLink) {
                imagemLink.value = '';
                imagemLink.disabled = true;
                imagemLink.placeholder = 'Desabilitado - arquivo selecionado';
            }
        } else {
            if (imagemLink) {
                imagemLink.disabled = false;
                imagemLink.placeholder = 'https://exemplo.com/imagem.jpg';
            }
        }
    });

    // Se informar link, mostra preview e limpa file
    imagemLink?.addEventListener('input', (e) => {
        const v = e.target.value.trim();
        if (v) {
            if (previewMainImage) {
                previewMainImage.src = v;
                previewMainImage.className = 'current-image';
            }
            if (imagemFile) imagemFile.value = '';
        }
    });

    // Thumbnails: remover existente
    thumbsList?.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('btn-remove-thumb')) {
            const item = e.target.closest('.thumb-item');
            if (!item) return;
            // Remove input hidden existingThumbnails[] para não enviar
            const hidden = item.querySelector('input[name="existingThumbnails[]"]');
            if (hidden) hidden.remove();
            item.remove();
        }
    });

    // Preview thumbnails upload (apenas visual, o envio será pelo form)
    thumbnailUpload?.addEventListener('change', (e) => {
        // Se arquivos selecionados, limpa campo de links
        if (thumbnailLinks) thumbnailLinks.value = '';
        // Remove prévias temporárias existentes geradas (temp/link)
        thumbsList.querySelectorAll('.thumb-item[data-temp="1"], .thumb-item[data-link="1"]').forEach(n => n.remove());
        
        const files = Array.from(e.target.files || []);
        files.forEach(f => {
            const url = URL.createObjectURL(f);
            const div = document.createElement('div');
            div.className = 'thumb-item temp';
            div.dataset.temp = '1';
            div.innerHTML = `
                <img src="${url}" alt="Preview thumbnail">
                <button type="button" class="btn-remove-thumb" title="Remover">×</button>
            `;
            thumbsList.appendChild(div);
        });
    });

    // Se o usuário digitar links, mostrar preview (sem remover existentes)
    thumbnailLinks?.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        // Remove previews temporários de links anteriores
        thumbsList.querySelectorAll('.thumb-item[data-link="1"]').forEach(n => n.remove());
        if (!val) return;
        
        const urls = val.split(',').map(s => s.trim()).filter(Boolean);
        urls.forEach(url => {
            const div = document.createElement('div');
            div.className = 'thumb-item link';
            div.dataset.link = '1';
            div.innerHTML = `
                <img src="${url}" alt="Thumbnail link" onerror="this.style.display='none'">
                <button type="button" class="btn-remove-thumb" title="Remover">×</button>
                <input type="hidden" name="newThumbnailLinks[]" value="${url}">
            `;
            thumbsList.appendChild(div);
        });
    });

    // Remover previews temporários ao clicar botão remove
    thumbsList.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('btn-remove-thumb')) {
            const item = e.target.closest('.thumb-item');
            if (item && (item.dataset.temp === '1' || item.dataset.link === '1')) {
                item.remove();
            }
        }
    });
});