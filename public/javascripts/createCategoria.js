// Não é necessário JS para cadastro/listagem de categorias.
// Toda a lógica agora é feita pelo backend e renderizada pelo EJS.
// Se quiser, pode adicionar validação simples aqui futuramente.

document.querySelectorAll('.form-excluir-categoria').forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const categoriaId = this.getAttribute('data-categoria-id');
        const categoriaNome = this.closest('.category-item').querySelector('.category-name').textContent;
        
        fetch(`/createCategoria/categorias/tem-produtos/${categoriaId}`)
            .then(res => res.json())
            .then(data => {
                if (data.temProdutos) {
                    // ✅ MODAL ELEGANTE para categorias com produtos
                    mostrarAvisoComProdutos(categoriaNome);
                } else {
                    // ✅ MODAL ELEGANTE para confirmação de exclusão
                    mostrarConfirmacaoExclusao(categoriaNome, form);
                }
            })
            .catch(() => {
                mostrarErro('Erro ao verificar produtos da categoria.');
            });
    });
});

// Modal para avisar que há produtos vinculados
function mostrarAvisoComProdutos(categoriaNome) {
    const modalHTML = `
        <div class="modal fade" id="avisoComProdutosModal" tabindex="-1" aria-labelledby="avisoLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg">
                    <div class="modal-header bg-danger text-white border-0">
                        <h5 class="modal-title" id="avisoLabel">
                            <i class="fas fa-exclamation-triangle me-2"></i>Não é Possível Excluir
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body py-4">
                        <div class="alert alert-danger d-flex align-items-center mb-3">
                            <i class="fas fa-shield-alt me-3 fa-lg"></i>
                            <span>Esta categoria possui produtos vinculados</span>
                        </div>
                        <p class="mb-3">
                            <strong>Categoria:</strong> <span class="text-primary">"${categoriaNome}"</span>
                        </p>
                        <p class="text-muted mb-0">
                            Para remover esta categoria, você precisa primeiro:
                        </p>
                        <ul class="text-muted mt-2 ps-3">
                            <li>Excluir os produtos vinculados, ou</li>
                            <li>Mover os produtos para outra categoria</li>
                        </ul>
                    </div>
                    <div class="modal-footer border-0 bg-light">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Entendido</button>
                        <a href="/seeProduto" class="btn btn-primary">
                            <i class="fas fa-box-open me-2"></i>Ver Produtos
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('avisoComProdutosModal'));
    modal.show();

    document.getElementById('avisoComProdutosModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Modal para confirmação de exclusão
function mostrarConfirmacaoExclusao(categoriaNome, form) {
    const modalHTML = `
        <div class="modal fade" id="confirmacaoExclusaoModal" tabindex="-1" aria-labelledby="confirmLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg">
                    <div class="modal-header bg-warning text-dark border-0">
                        <h5 class="modal-title" id="confirmLabel">
                            <i class="fas fa-trash-alt me-2"></i>Confirmar Exclusão
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body py-4">
                        <div class="alert alert-warning d-flex align-items-center mb-3">
                            <i class="fas fa-info-circle me-3 fa-lg"></i>
                            <span>Esta ação não pode ser desfeita</span>
                        </div>
                        <p class="mb-2">
                            Você tem certeza que deseja excluir a categoria:
                        </p>
                        <p class="alert alert-light p-3 border-start border-warning">
                            <strong>"${categoriaNome}"</strong>
                        </p>
                        <p class="text-muted small mb-0">
                            <i class="fas fa-check-circle text-success me-2"></i>Esta categoria não possui produtos vinculados.
                        </p>
                    </div>
                    <div class="modal-footer border-0 bg-light">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-danger" onclick="confirmarExclusao('${form.getAttribute('data-categoria-id')}')">
                            <i class="fas fa-trash-alt me-2"></i>Sim, Excluir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('confirmacaoExclusaoModal'));
    modal.show();

    document.getElementById('confirmacaoExclusaoModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Função para confirmar exclusão
function confirmarExclusao(categoriaId) {
    const form = document.querySelector(`form[data-categoria-id="${categoriaId}"]`);
    if (form) {
        form.submit();
    }
}

// Modal para erro
function mostrarErro(mensagem) {
    const modalHTML = `
        <div class="modal fade" id="erroModal" tabindex="-1" aria-labelledby="erroLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg">
                    <div class="modal-header bg-danger text-white border-0">
                        <h5 class="modal-title" id="erroLabel">
                            <i class="fas fa-times-circle me-2"></i>Erro
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body py-4">
                        <div class="alert alert-danger d-flex align-items-center">
                            <i class="fas fa-exclamation-circle me-3 fa-lg"></i>
                            <span>${mensagem}</span>
                        </div>
                    </div>
                    <div class="modal-footer border-0 bg-light">
                        <button type="button" class="btn btn-outline-danger" data-bs-dismiss="modal">Fechar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('erroModal'));
    modal.show();

    document.getElementById('erroModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Função para validar nome de categoria
function nomeCategoriaValido(nome) {
    return /^[A-Za-zÀ-ÿ0-9]+( [A-Za-zÀ-ÿ0-9]+)*$/.test(nome.trim());
}

// CREATE
document.getElementById('categoryForm')?.addEventListener('submit', function(e) {
    const nome = document.getElementById('categoryName').value;
    if (!nomeCategoriaValido(nome)) {
        e.preventDefault();
        mostrarErro('O nome da categoria não pode conter caracteres especiais. Use apenas letras, números e espaços.');
    }
});

// EDIT
document.querySelector('form[action*="categorias/editar"]')?.addEventListener('submit', function(e) {
    const nome = document.getElementById('categoryName').value;
    if (!nomeCategoriaValido(nome)) {
        e.preventDefault();
        mostrarErro('O nome da categoria não pode conter caracteres especiais. Use apenas letras, números e espaços.');
    }
});

// === ADICIONADO: Drag & Drop para reordenar categorias ===
(function() {
  const list = document.getElementById('categoryList');
  if (!list) return;

  // habilita draggable nos itens existentes
  function enableDraggables() {
    list.querySelectorAll('li.category-item').forEach(li => {
      li.setAttribute('draggable', 'true');
      li.classList.add('draggable-item');
    });
  }
  enableDraggables();

  let draggingElem = null;

  list.addEventListener('dragstart', (e) => {
    const li = e.target.closest('li.category-item');
    if (!li) return;
    draggingElem = li;
    li.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  list.addEventListener('dragend', (e) => {
    if (draggingElem) {
      draggingElem.classList.remove('dragging');
      draggingElem = null;
      // salva nova ordem após soltar
      salvarOrdem();
    }
  });

  list.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(list, e.clientY);
    const dragging = document.querySelector('.dragging');
    if (!dragging) return;
    if (afterElement == null) {
      list.appendChild(dragging);
    } else {
      list.insertBefore(dragging, afterElement);
    }
  });

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li.category-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element || null;
  }

  // envia nova ordem para o servidor
  async function salvarOrdem() {
    const ids = [...list.querySelectorAll('li.category-item')].map(li => li.dataset.id).filter(Boolean);
    if (ids.length === 0) return;
    try {
      const resp = await fetch('/createCategoria/categorias/reordenar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: ids })
      });
      const data = await resp.json();
      if (resp.ok && data.ok) {
        // feedback visual centralizado e estilizado
        if (!document.getElementById('categoria-toast-style')) {
          const style = document.createElement('style');
          style.id = 'categoria-toast-style';
          style.textContent = `
            .categoria-toast-center {
              position: fixed;
              left: 50%;
              top: 9%;
              transform: translate(-50%, -50%);
              z-index: 10800;
              display: flex;
              gap: 0.9rem;
              align-items: center;
              background: linear-gradient(90deg,#e6ffed,#d1f6e3);
              color: #0f5132;
              border: 1px solid rgba(40,167,69,0.15);
              padding: 1rem 1.25rem;
              border-radius: 12px;
              box-shadow: 0 8px 30px rgba(34,50,84,0.12);
              font-weight: 600;
              font-size: 0.98rem;
              min-width: 260px;
              max-width: 90%;
              text-align: center;
              backdrop-filter: blur(4px);
              opacity: 0;
              animation: toastIn 360ms ease forwards;
            }
            .categoria-toast-center .icon {
              font-size: 1.45rem;
              color: #198754;
            }
            @keyframes toastIn {
              from { transform: translate(-50%, -45%) scale(0.96); opacity: 0; }
              to   { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
            @keyframes toastOut {
              from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
              to   { opacity: 0; transform: translate(-50%, -55%) scale(0.98); }
            }
          `;
          document.head.appendChild(style);
        }

        const card = document.createElement('div');
        card.className = 'categoria-toast-center';
        card.innerHTML = '<i class="fas fa-check-circle icon" aria-hidden="true"></i><div>Ordem de categorias salva</div>';
        document.body.appendChild(card);
        // remove com animação de saída
        setTimeout(() => {
          card.style.animation = 'toastOut 300ms ease forwards';
          setTimeout(() => card.remove(), 300);
        }, 1600);
       } else {
         throw new Error(data.error || 'Erro ao salvar ordem');
       }
    } catch (err) {
      mostrarErro('Não foi possível salvar a ordem. Tente novamente.');
      console.error('Erro salvarOrdem:', err);
    }
  }
})();
