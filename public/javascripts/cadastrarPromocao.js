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

            // Imagem do produto
            const img = document.createElement('img');
            img.src = selecionado.imagem;
            img.alt = 'Foto do produto';
            img.className = 'produto-imagem-promocao mb-2';
            img.style.maxWidth = '120px';
            img.style.maxHeight = '120px';
            img.style.borderRadius = '8px';
            img.style.border = '1px solid #e0e3eb';
            img.style.display = 'block';

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
                const valorReal = Number(selecionado.valor);
                let valorPromo = Number(this.value);

                // Limite: mínimo R$1,00 abaixo do valor real
                if (valorPromo > 0 && valorPromo > (valorReal - 1)) {
                    this.value = (valorReal - 1).toFixed(2);
                    valorPromo = valorReal - 1;
                }
                // Limite: máximo até 2 casas decimais
                if (this.value && !/^\d+(\.\d{1,2})?$/.test(this.value)) {
                    this.value = valorPromo.toFixed(2);
                }
                if (valorPromo <= 0) {
                    this.value = '';
                }
                // Alternância dos campos
                if (this.value && Number(this.value) > 0) {
                    porcentInput.value = '';
                    porcentInput.disabled = true;
                } else {
                    porcentInput.disabled = false;
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

            // Labels para os campos
            const porcentLabel = document.createElement('span');
            porcentLabel.textContent = 'Porcentagem (%)';
            porcentLabel.className = 'novo-valor-label me-2';

            const valorLabel = document.createElement('span');
            valorLabel.textContent = 'Valor Promocional';
            valorLabel.className = 'novo-valor-label me-2';

            // Agrupando: joga inputs e botão para a direita
            const rightGroup = document.createElement('div');
            rightGroup.className = 'd-flex align-items-center ms-auto gap-2';
            rightGroup.appendChild(porcentLabel);
            rightGroup.appendChild(porcentInput);
            rightGroup.appendChild(valorLabel);
            rightGroup.appendChild(promoInput);
            rightGroup.appendChild(btn);

            const infoCol = document.createElement('div');
            infoCol.className = 'd-flex flex-column align-items-start';
            infoCol.appendChild(nomeSpan);
            infoCol.appendChild(img);
            infoCol.appendChild(precoSpan);

            const row = document.createElement('div');
            row.className = 'd-flex flex-wrap align-items-center gap-2 w-100';
            row.appendChild(infoCol);
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
                        <div class="d-flex align-items-center gap-3" style="min-width:0;overflow:hidden;">
                            <img src="${promo.imagem}" alt="Promo" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">
                            <div style="min-width:0;">
                                <div style="font-weight:600;overflow-wrap:break-word;max-width:220px;">${promo.produto_nome}</div>
                                <div style="font-size:0.95rem;color:#888;">${promo.descricao || ''}</div>
                                <div style="font-size:0.95rem;color:#28a745;font-weight:600;">R$ ${Number(promo.valor_promocional).toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
                            </div>
                        </div>
                        <button class="btn btn-danger btn-sm" data-id="${promo.id}" style="margin-left:auto;min-width:110px;">
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

    // Define data e hora padrão
    const dataFim = document.getElementById('dataFim');
    const horaFim = document.getElementById('horaFim');
    const minutoFim = document.getElementById('minutoFim');
    if (dataFim) {
        const hoje = new Date();
        dataFim.value = hoje.toISOString().split('T')[0];
    }
    if (horaFim && minutoFim) {
        const agora = new Date();
        horaFim.value = agora.getHours().toString().padStart(2, '0');
        minutoFim.value = (Math.floor(agora.getMinutes() / 5) * 5).toString().padStart(2, '0');
    }
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

porcentInput.addEventListener('input', function() {
    // Remove caracteres não numéricos
    this.value = this.value.replace(/[^\d]/g, '');

    let val = Number(this.value);

    // Não permite negativo
    if (val < 0) val = 0;

    // Não permite acima de 100%
    if (val > 100) val = 100;

    this.value = val ? val : '';

    // Alternância dos campos
    if (val > 0) {
        promoInput.value = '';
        promoInput.disabled = true;
    } else {
        promoInput.disabled = false;
    }
});