document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const searchInput = document.getElementById('searchProduto');
    const produtoRows = document.querySelectorAll('.produto-row');
    const resultsCount = document.querySelector('.results-count');
    
    // Inicializar tooltips do Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Filtro de pesquisa em tempo real
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        let visibleCount = 0;
        
        produtoRows.forEach(row => {
            const nome = row.getAttribute('data-nome');
            const categoria = row.getAttribute('data-categoria').toLowerCase();
            const id = row.querySelector('.produto-id').textContent.toLowerCase();
            
            const matches = nome.includes(searchTerm) || 
                           categoria.includes(searchTerm) || 
                           id.includes(searchTerm);
            
            if (matches) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        // Atualizar contador de resultados
        if (resultsCount) {
            resultsCount.textContent = `${visibleCount} produtos encontrados`;
        }
    });
    
    // Função para mostrar detalhes do produto
    window.showProductDetails = function(produto) {
        const modalBody = document.getElementById('productDetails');
        
        // Criar HTML dos detalhes do produto
        const detailsHTML = `
            <div class="row">
                <div class="col-md-4 text-center">
                    ${produto.imagem ? 
                        `<img src="${produto.imagem}" alt="${produto.nome}" class="img-fluid rounded mb-3" style="max-height: 200px;">` :
                        `<div class="bg-light rounded d-flex align-items-center justify-content-center mb-3" style="height: 200px;">
                            <i class="fas fa-box-open fa-3x text-muted"></i>
                        </div>`
                    }
                    <h4 class="mb-2">${produto.nome}</h4>
                    <span class="badge bg-primary">ID: ${produto.ID}</span>
                </div>
                <div class="col-md-8">
                    <div class="row mb-3">
                        <div class="col-6">
                            <strong>Valor:</strong>
                            <div class="h5 text-success">R$ ${Number(produto.valor).toFixed(2).replace('.', ',')}</div>
                        </div>
                        <div class="col-6">
                            <strong>Estoque:</strong>
                            <div>
                                <span class="badge ${produto.estoque > 10 ? 'bg-success' : produto.estoque > 0 ? 'bg-warning' : 'bg-danger'}">
                                    ${produto.estoque} unidades
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <strong>Categoria:</strong>
                        <div>${produto.categoria_nome || produto.categoria || produto.Categoria_ID}</div>
                    </div>
                    
                    ${produto.descricao ? `
                        <div class="mb-3">
                            <strong>Descrição:</strong>
                            <div>${produto.descricao}</div>
                        </div>
                    ` : ''}
                    
                    <div class="row">
                        ${produto.cor ? `<div class="col-6 mb-2"><strong>Cor:</strong> ${produto.cor}</div>` : ''}
                        ${produto.tamanho ? `<div class="col-6 mb-2"><strong>Tamanho:</strong> ${produto.tamanho}</div>` : ''}
                        ${produto.peso ? `<div class="col-6 mb-2"><strong>Peso:</strong> ${produto.peso}</div>` : ''}
                        ${produto.cilindrada ? `<div class="col-6 mb-2"><strong>Cilindrada:</strong> ${produto.cilindrada}</div>` : ''}
                        ${produto.potencia ? `<div class="col-6 mb-2"><strong>Potência:</strong> ${produto.potencia}</div>` : ''}
                        ${produto.tanque ? `<div class="col-6 mb-2"><strong>Tanque:</strong> ${produto.tanque}</div>` : ''}
                        ${produto.material ? `<div class="col-6 mb-2"><strong>Material:</strong> ${produto.material}</div>` : ''}
                        ${produto.protecao ? `<div class="col-6 mb-2"><strong>Proteção:</strong> ${produto.protecao}</div>` : ''}
                    </div>
                    
                    ${produto.thumbnails ? `
                        <div class="mt-3">
                            <strong>Thumbnails:</strong>
                            <div class="d-flex flex-wrap gap-2 mt-2">
                                ${Array.isArray(produto.thumbnails) ? 
                                    produto.thumbnails.map(url => 
                                        `<a href="${url.trim()}" target="_blank">
                                            <img src="${url.trim()}" alt="Thumbnail" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                                        </a>`
                                    ).join('') :
                                    String(produto.thumbnails).split(',').map(url => 
                                        `<a href="${url.trim()}" target="_blank">
                                            <img src="${url.trim()}" alt="Thumbnail" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                                        </a>`
                                    ).join('')
                                }
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        modalBody.innerHTML = detailsHTML;
        
        // Abrir modal
        const productModal = new bootstrap.Modal(document.getElementById('productModal'));
        productModal.show();
    };
    
    // Adicionar efeitos de hover nas linhas
    // remover transform hover (comportamento anterior) — manter sem destaque visual
    produtoRows.forEach(row => {
        row.addEventListener('mouseenter', function() { /* noop */ });
        row.addEventListener('mouseleave', function() { /* noop */ });
    });
    
    // CONFIRMAÇÃO DE EXCLUSÃO (modal)
    const confirmModalEl = document.getElementById('confirmDeleteModal');
    const confirmDeleteText = document.getElementById('confirmDeleteText');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    let formToDelete = null;

    const bsConfirmModal = confirmModalEl ? new bootstrap.Modal(confirmModalEl) : null;

    document.querySelectorAll('.btn-delete-prod').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            // localizar o form pai correspondente
            formToDelete = this.closest('form');
            const nome = this.getAttribute('data-nome') || this.getAttribute('data-id') || 'este produto';
            // atualizar texto do modal
            if (confirmDeleteText) {
                confirmDeleteText.textContent = `Deseja excluir "${nome}"? Esta ação não pode ser desfeita.`;
            }
            if (bsConfirmModal) bsConfirmModal.show();
        });
    });

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function () {
            if (formToDelete) {
                // submeter o form (POST)
                formToDelete.submit();
            }
            if (bsConfirmModal) bsConfirmModal.hide();
        });
    }

    // Foco automático na busca
    searchInput.focus();
});