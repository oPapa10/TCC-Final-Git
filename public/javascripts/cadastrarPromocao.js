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
    // Buscar produtos válidos para promoção
    fetch('/cadastrarPromocao/produtos-disponiveis')
        .then(res => res.json())
        .then(data => {
            produtos = data;
            mostrarLista('');
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

            // Campo porcentagem
            const porcentInput = document.createElement('input');
            porcentInput.type = 'number';
            porcentInput.step = '1';
            porcentInput.min = '1';
            porcentInput.max = '99';
            porcentInput.className = 'form-control ms-md-3';
            porcentInput.style.maxWidth = '120px';
            porcentInput.placeholder = '% desconto';
            porcentInput.name = 'porcentagemPromocao';
            porcentInput.id = 'porcentagemPromocao';

            // Campo valor promocional
            const promoInput = document.createElement('input');
            promoInput.type = 'number';
            promoInput.step = '0.01';
            promoInput.min = '0.01';
            promoInput.required = true;
            promoInput.className = 'form-control ms-md-3';
            promoInput.style.maxWidth = '120px';
            promoInput.placeholder = 'Novo valor';
            promoInput.name = 'valorPromocao';
            promoInput.id = 'valorPromocao';

            // Alternância dos campos
            porcentInput.addEventListener('input', function() {
                if (this.value && Number(this.value) > 0) {
                    promoInput.value = '';
                    promoInput.disabled = true;
                } else {
                    promoInput.disabled = false;
                }
            });
            promoInput.addEventListener('input', function() {
                if (this.value && Number(this.value) > 0) {
                    porcentInput.value = '';
                    porcentInput.disabled = true;
                } else {
                    porcentInput.disabled = false;
                }
                // Limite: máximo até 1 centavo abaixo do valor real
                const valorReal = Number(selecionado.valor);
                let valorPromo = Number(this.value);
                if (valorPromo >= valorReal) {
                    this.value = (valorReal - 0.01).toFixed(2);
                }
                if (valorPromo <= 0) {
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

            // Agrupando: joga inputs e botão para a direita
            const rightGroup = document.createElement('div');
            rightGroup.className = 'd-flex align-items-center ms-auto gap-2';
            rightGroup.appendChild(porcentInput);
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
        const promoInput = document.getElementById('valorPromocao');
        const porcentInput = document.getElementById('porcentagemPromocao');
        const valorReal = Number(selecionado.valor);

        let valorPromo = promoInput.value ? Number(promoInput.value) : null;
        let porcentagemPromo = porcentInput.value ? Number(porcentInput.value) : null;

        if (!valorPromo && !porcentagemPromo) {
            e.preventDefault();
            alert('Informe o valor promocional ou a porcentagem de desconto!');
            return;
        }

        if (valorPromo) {
            if (valorPromo <= 0 || valorPromo >= valorReal) {
                e.preventDefault();
                alert('O valor promocional deve ser até 1 centavo abaixo do valor real do produto!');
                promoInput.value = (valorReal - 0.01).toFixed(2);
                return;
            }
        }
        if (porcentagemPromo) {
            if (porcentagemPromo <= 0 || porcentagemPromo >= 100) {
                e.preventDefault();
                alert('Informe uma porcentagem válida!');
                return;
            }
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
        // Só envia se preenchido
        hiddenPromo.value = promoInput.value ? promoInput.value : '';

        // Adiciona a porcentagem em um campo oculto
        let hiddenPorcent = document.getElementById('porcentagemPromocaoHidden');
        if (!hiddenPorcent) {
            hiddenPorcent = document.createElement('input');
            hiddenPorcent.type = 'hidden';
            hiddenPorcent.name = 'porcentagemPromocao';
            hiddenPorcent.id = 'porcentagemPromocaoHidden';
            this.appendChild(hiddenPorcent);
        }
        // Só envia se preenchido
        hiddenPorcent.value = porcentInput.value ? porcentInput.value : '';

        // Remova o campo oculto vazio antes de enviar
        if (!promoInput.value) hiddenPromo.parentNode.removeChild(hiddenPromo);
        if (!porcentInput.value) hiddenPorcent.parentNode.removeChild(hiddenPorcent);
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

    // Carregar produtos disponíveis para promoção
    fetch('/cadastrarPromocao/produtos-disponiveis')
        .then(res => res.json())
        .then(produtos => {
            // Monta o <select> ou lista de produtos válidos
            const select = document.getElementById('produtosIds');
            if (select) {
                select.innerHTML = '';
                produtos.forEach(produto => {
                    const option = document.createElement('option');
                    option.value = produto.ID;
                    option.textContent = `${produto.nome} (R$${produto.valor})`;
                    select.appendChild(option);
                });
            }
            // Se usar busca personalizada, atualize a lista JS também!
            window.produtos = produtos;
        });
});

document.getElementById('porcentagemPromocao')?.addEventListener('input', function() {
    const valorPromocao = document.getElementById('valorPromocao');
    if (this.value && Number(this.value) > 0) {
        valorPromocao.value = '';
        valorPromocao.disabled = true;
    } else {
        valorPromocao.disabled = false;
    }
});
document.getElementById('valorPromocao')?.addEventListener('input', function() {
    const porcentagemPromocao = document.getElementById('porcentagemPromocao');
    if (this.value && Number(this.value) > 0) {
        porcentagemPromocao.value = '';
        porcentagemPromocao.disabled = true;
    } else {
        porcentagemPromocao.disabled = false;
    }
});

// Preview da imagem do upload
document.getElementById('imagem')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const previewBg = document.getElementById('imagemPreviewBg');
    const overlay = document.getElementById('imagemPreviewOverlay');
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            previewBg.style.backgroundImage = `url('${ev.target.result}')`;
            overlay.style.background = 'rgba(255,255,255,0.5)';
        };
        reader.readAsDataURL(file);
    } else {
        previewBg.style.backgroundImage = '';
        overlay.style.background = 'rgba(255,255,255,0.7)';
    }
});

// Usar imagem do produto selecionado
document.getElementById('btnUsarImagemProduto')?.addEventListener('click', function() {
    if (!selecionado || !selecionado.imagem) {
        alert('Selecione um produto que tenha imagem cadastrada!');
        return;
    }
    const previewBg = document.getElementById('imagemPreviewBg');
    const overlay = document.getElementById('imagemPreviewOverlay');
    previewBg.style.backgroundImage = `url('${selecionado.imagem}')`;
    overlay.style.background = 'rgba(255,255,255,0.5)';
    document.getElementById('imagem').value = '';
    let hiddenImg = document.getElementById('imagemProdutoSelecionada');
    if (!hiddenImg) {
        hiddenImg = document.createElement('input');
        hiddenImg.type = 'hidden';
        hiddenImg.name = 'imagemProdutoSelecionada';
        hiddenImg.id = 'imagemProdutoSelecionada';
        document.getElementById('formPromocao').appendChild(hiddenImg);
    }
    hiddenImg.value = selecionado.imagem;
});