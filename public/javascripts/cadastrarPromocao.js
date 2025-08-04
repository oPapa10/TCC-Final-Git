document.getElementById('formPromocao')?.addEventListener('submit', function(e) {
    const titulo = document.getElementById('titulo').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    const imagem = document.getElementById('imagem').files[0];
    if (!titulo || !descricao || !imagem) {
        e.preventDefault();
        alert('Preencha todos os campos obrigatórios!');
    }
});

let produtos = [];
let selecionado = null;

document.addEventListener('DOMContentLoaded', function() {
    // Buscar produtos via AJAX
    fetch('/seeProduto/lista')
        .then(res => res.json())
        .then(data => {
            produtos = data;
            mostrarLista(''); // Mostra todos ao carregar
        });

    const busca = document.getElementById('produtoBusca');
    const lista = document.getElementById('produtosLista');
    const selecionadosUl = document.getElementById('produtosSelecionados');

    busca.addEventListener('input', function() {
        mostrarLista(this.value);
    });

    function mostrarLista(termo) {
        termo = termo.toLowerCase();
        lista.innerHTML = '';
        lista.style.display = selecionado ? 'none' : 'block';
        if (selecionado) return; // Não mostra lista se já tem um selecionado
        produtos
            .filter(p => !termo || p.nome.toLowerCase().includes(termo))
            .forEach(prod => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'list-group-item list-group-item-action';
                item.textContent = prod.nome;
                item.onclick = () => {
                    selecionado = prod;
                    atualizarSelecionado();
                    busca.value = '';
                    lista.innerHTML = '';
                    lista.style.display = 'none';
                };
                lista.appendChild(item);
            });
        if (lista.innerHTML === '') lista.style.display = 'none';
    }

    function atualizarSelecionado() {
        selecionadosUl.innerHTML = '';
        if (selecionado) {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2';

            // Nome do produto
            const nomeSpan = document.createElement('span');
            nomeSpan.textContent = selecionado.nome;
            nomeSpan.style.fontWeight = 'bold';

            // Preço real
            const precoSpan = document.createElement('span');
            precoSpan.className = 'ms-md-3 text-muted';
            precoSpan.textContent = `Preço atual: R$ ${Number(selecionado.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;

            // Caixa para valor promocional (mais largo)
            const promoInput = document.createElement('input');
            promoInput.type = 'number';
            promoInput.step = '0.01';
            promoInput.min = '0';
            promoInput.required = true;
            promoInput.className = 'form-control ms-md-3';
            promoInput.style.maxWidth = '220px'; // Mais largo
            promoInput.placeholder = 'Novo valor';
            promoInput.name = 'valorPromocao';

            // Limita automaticamente para 1 real a menos que o valor real
            promoInput.addEventListener('input', function() {
                const valorReal = Number(selecionado.valor);
                let valorPromo = Number(this.value);
                if (valorPromo >= valorReal) {
                    this.value = (valorReal - 1).toFixed(2);
                }
                if (valorPromo < 0) {
                    this.value = '';
                }
            });

            // Remover botão
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-sm btn-danger ms-md-3 mt-2 mt-md-0';
            btn.textContent = 'Remover';
            btn.onclick = () => {
                selecionado = null;
                atualizarSelecionado();
                mostrarLista(busca.value);
            };

            // Agrupando: joga input e botão para a direita
            const rightGroup = document.createElement('div');
            rightGroup.className = 'd-flex align-items-center ms-auto gap-2';
            rightGroup.appendChild(promoInput);
            rightGroup.appendChild(btn);

            const row = document.createElement('div');
            row.className = 'd-flex flex-column flex-md-row align-items-md-center gap-2 w-100';
            row.appendChild(nomeSpan);
            row.appendChild(precoSpan);
            row.appendChild(rightGroup);

            li.appendChild(row);
            selecionadosUl.appendChild(li);
        }
    }

    // Ao enviar, adiciona os IDs dos produtos selecionados em um campo oculto
    document.getElementById('formPromocao').addEventListener('submit', function(e) {
        if (!selecionado) {
            e.preventDefault();
            alert('Selecione um produto para a promoção!');
            return;
        }
        const promoInput = document.querySelector('input[name="valorPromocao"]');
        const valorReal = Number(selecionado.valor);
        const valorPromo = Number(promoInput.value);

        if (!promoInput.value || valorPromo <= 0) {
            e.preventDefault();
            alert('Informe o novo valor promocional!');
            return;
        }
        if (valorPromo >= valorReal) {
            e.preventDefault();
            alert('O valor promocional deve ser menor que o valor real do produto!');
            return;
        }
        let hidden = document.getElementById('produtosIds');
        if (!hidden) {
            hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = 'produtosIds';
            hidden.id = 'produtosIds';
            this.appendChild(hidden);
        }
        hidden.value = selecionado.ID;

        // Adiciona o valor promocional em um campo oculto
        let hiddenPromo = document.getElementById('valorPromocaoHidden');
        if (!hiddenPromo) {
            hiddenPromo = document.createElement('input');
            hiddenPromo.type = 'hidden';
            hiddenPromo.name = 'valorPromocao';
            hiddenPromo.id = 'valorPromocaoHidden';
            this.appendChild(hiddenPromo);
        }
        hiddenPromo.value = promoInput.value;
    });

    function carregarPromocoes() {
        fetch('/cadastrarPromocao/listar')
            .then(res => res.json())
            .then(promocoes => {
                const lista = document.getElementById('listaPromocoes');
                lista.innerHTML = '';
                if (!promocoes.length) {
                    lista.innerHTML = '<li class="list-group-item text-center text-muted">Nenhuma promoção cadastrada.</li>';
                    return;
                }
                promocoes.forEach(promo => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex align-items-center justify-content-between gap-2';
                    li.innerHTML = `
                        <div class="d-flex align-items-center gap-3">
                            <img src="${promo.imagem}" alt="Promo" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">
                            <div>
                                <div style="font-weight:600;">${promo.produto_nome}</div>
                                <div style="font-size:0.95rem;color:#888;">${promo.descricao || ''}</div>
                                <div style="font-size:0.95rem;color:#28a745;font-weight:600;">R$ ${Number(promo.valor_promocional).toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
                            </div>
                        </div>
                        <button class="btn btn-danger btn-sm" data-id="${promo.id}">
                            <i class="fas fa-trash"></i> Remover
                        </button>
                    `;
                    lista.appendChild(li);
                });

                // Evento de remoção
                lista.querySelectorAll('button[data-id]').forEach(btn => {
                    btn.onclick = function() {
                        if (confirm('Tem certeza que deseja remover esta promoção?')) {
                            fetch(`/cadastrarPromocao/remover/${this.dataset.id}`, { method: 'POST' })
                                .then(res => res.json())
                                .then(resp => {
                                    if (resp.success) {
                                        carregarPromocoes();
                                    } else {
                                        alert('Erro ao remover promoção.');
                                    }
                                });
                        }
                    };
                });
            });
    }

    // Chama ao carregar a página
    carregarPromocoes();
});