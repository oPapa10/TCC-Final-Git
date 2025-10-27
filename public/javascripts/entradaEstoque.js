document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const produtoSelect = document.getElementById('produto');
    const searchProduto = document.getElementById('searchProduto');
    const searchProdutoId = document.getElementById('searchProdutoId');
    const quantidadeInput = document.getElementById('quantidade');
    const novoEstoqueInput = document.getElementById('novoEstoque');
    const produtoInfo = document.getElementById('produtoInfo');
    const resultadoPreview = document.getElementById('resultadoPreview');
    
    // Elementos de informação do produto
    const infoNome = document.getElementById('infoNome');
    const infoId = document.getElementById('infoId');
    const infoEstoqueAtual = document.getElementById('infoEstoqueAtual');
    
    // Elementos de preview
    const previewAdicionar = document.getElementById('previewAdicionar');
    const previewNovo = document.getElementById('previewNovo');
    const previewAtual = document.getElementById('previewAtual');
    const previewQuantidade = document.getElementById('previewQuantidade');
    const previewDefinido = document.getElementById('previewDefinido');
    const previewFinal = document.getElementById('previewFinal');
    
    // Estado atual
    let produtoSelecionado = null;
    let estoqueAtual = 0;
    
    // Filtro de pesquisa por nome
    searchProduto.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        filterProdutos(searchTerm, 'nome');
    });
    
    // Filtro de pesquisa por ID
    searchProdutoId.addEventListener('input', function() {
        const searchTerm = this.value;
        filterProdutos(searchTerm, 'id');
    });
    
    // Quando um produto é selecionado
    produtoSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        
        if (this.value) {
            produtoSelecionado = {
                id: this.value,
                nome: selectedOption.text.split(' (ID:')[0],
                estoque: parseInt(selectedOption.getAttribute('data-estoque'))
            };
            
            estoqueAtual = produtoSelecionado.estoque;
            mostrarInfoProduto();
            atualizarPreview();
        } else {
            esconderInfoProduto();
        }
    });
    
    // elementos do modo (toggle automático por INPUT)
    const modoHidden = document.getElementById('modoEstoqueHidden');
    let currentMode = null; // null | 'adicionar' | 'definir'
    let lastEdited = null; // 'quantidade' | 'novo' (para desempate se ambos tiverem números)
    
    // Atualizar preview quando quantidade mudar
    quantidadeInput.addEventListener('input', function() {
        lastEdited = 'quantidade';
        if (this.value !== '') {
            previewAdicionar.textContent = `+${this.value}`;
        } else {
            previewAdicionar.textContent = '+0';
        }
        atualizarModoComBaseNosCampos();
        atualizarPreview();
    });
    
    // Atualizar preview quando novo estoque mudar
    novoEstoqueInput.addEventListener('input', function() {
        lastEdited = 'novo';
        if (this.value !== '') {
            previewNovo.textContent = `=${this.value}`;
        } else {
            previewNovo.textContent = '=0';
        }
        atualizarModoComBaseNosCampos();
        atualizarPreview();
    });
    
    // Define modo apenas com base em conteúdo dos campos (não por foco/seleção)
    function atualizarModoComBaseNosCampos() {
        const hasQtd = quantidadeInput.value !== '' && !isNaN(Number(quantidadeInput.value)) && Number(quantidadeInput.value) !== 0;
        const hasNovo = novoEstoqueInput.value !== '' && !isNaN(Number(novoEstoqueInput.value));
        
        // se ambos vazios -> sem modo
        if (!hasQtd && !hasNovo) {
            setMode(null);
            return;
        }
        
        // se apenas um preenchido -> esse modo
        if (hasQtd && !hasNovo) {
            setMode('adicionar');
            return;
        }
        if (hasNovo && !hasQtd) {
            setMode('definir');
            return;
        }
        
        // se ambos preenchidos -> priorizar último editado
        if (hasQtd && hasNovo) {
            if (lastEdited === 'quantidade') setMode('adicionar');
            else setMode('definir');
        }
    }
    
    // função que aplica/desfaz o modo (mantém preview)
    function setMode(mode) {
        if (mode === currentMode) return; // nada a fazer
        currentMode = mode;
        if (mode === 'adicionar') {
            modoHidden.value = 'adicionar';
            quantidadeInput.disabled = false;
            novoEstoqueInput.disabled = true;
        } else if (mode === 'definir') {
            modoHidden.value = 'definir';
            quantidadeInput.disabled = true;
            novoEstoqueInput.disabled = false;
        } else {
            modoHidden.value = '';
            quantidadeInput.disabled = false;
            novoEstoqueInput.disabled = false;
        }
    }
    
    // Função para filtrar produtos
    function filterProdutos(term, type) {
        const options = produtoSelect.options;
        
        for (let i = 1; i < options.length; i++) {
            const option = options[i];
            let match = false;
            
            if (type === 'nome') {
                match = option.text.toLowerCase().includes(term);
            } else if (type === 'id') {
                match = option.value === term || option.text.includes(`ID: ${term}`);
            }
            
            option.style.display = match ? '' : 'none';
        }
        
        // Se há apenas uma opção visível, selecione-a automaticamente
        const visibleOptions = Array.from(options).filter(opt => opt.style.display !== 'none' && opt.value !== '');
        if (visibleOptions.length === 1) {
            produtoSelect.value = visibleOptions[0].value;
            produtoSelect.dispatchEvent(new Event('change'));
        }
    }
    
    // Mostrar informações do produto selecionado
    function mostrarInfoProduto() {
        infoNome.textContent = produtoSelecionado.nome;
        infoId.textContent = produtoSelecionado.id;
        infoEstoqueAtual.textContent = produtoSelecionado.estoque;
        
        produtoInfo.style.display = 'block';
        resultadoPreview.style.display = 'block';
        
        // Destacar linha correspondente na tabela
        document.querySelectorAll('.produto-row').forEach(row => {
            if (row.getAttribute('data-id') === produtoSelecionado.id) {
                row.style.backgroundColor = 'rgba(67, 97, 238, 0.05)';
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                row.style.backgroundColor = '';
            }
        });
    }
    
    // Esconder informações do produto
    function esconderInfoProduto() {
        produtoInfo.style.display = 'none';
        resultadoPreview.style.display = 'none';
        
        // Remover destaque das linhas
        document.querySelectorAll('.produto-row').forEach(row => {
            row.style.backgroundColor = '';
        });
    }
    
    // Atualizar preview do resultado
    function atualizarPreview() {
        if (!produtoSelecionado) return;
        
        const quantidade = parseInt(quantidadeInput.value) || 0;
        const novoEstoque = parseInt(novoEstoqueInput.value);
        
        previewAtual.textContent = estoqueAtual;
        
        const modo = currentMode;
        if (modo === 'adicionar') {
            previewQuantidade.textContent = `+${quantidade}`;
            previewDefinido.textContent = '=0';
            var estoqueFinal = estoqueAtual + quantidade;
        } else {
            previewQuantidade.textContent = '+0';
            if (!isNaN(novoEstoque)) {
                previewDefinido.textContent = `=${novoEstoque}`;
                var estoqueFinal = novoEstoque;
            } else {
                previewDefinido.textContent = '=0';
                var estoqueFinal = estoqueAtual;
            }
        }
        
        previewFinal.textContent = estoqueFinal;
        
        // Colorir o resultado final baseado no valor
        if (estoqueFinal > 10) {
            previewFinal.style.color = 'var(--success)';
        } else if (estoqueFinal > 0) {
            previewFinal.style.color = 'var(--warning)';
        } else {
            previewFinal.style.color = 'var(--danger)';
        }
    }
    
    // Validação do formulário
    document.getElementById('estoqueForm').addEventListener('submit', function(e) {
        if (!produtoSelect.value) {
            e.preventDefault();
            alert('Por favor, selecione um produto.');
            produtoSelect.focus();
            return;
        }
        
        const quantidade = parseInt(quantidadeInput.value) || 0;
        const novoEstoque = parseInt(novoEstoqueInput.value);
        
        if (quantidade === 0 && isNaN(novoEstoque)) {
            e.preventDefault();
            alert('Por favor, informe uma quantidade para adicionar ou um novo valor de estoque.');
            quantidadeInput.focus();
            return;
        }
        
        if (quantidade < 0) {
            e.preventDefault();
            alert('A quantidade a adicionar não pode ser negativa.');
            quantidadeInput.focus();
            return;
        }
        
        if (!isNaN(novoEstoque) && novoEstoque < 0) {
            e.preventDefault();
            alert('O estoque não pode ser negativo.');
            novoEstoqueInput.focus();
            return;
        }
    });
    
    // Inicialização
    if (produtoSelect.value) {
        produtoSelect.dispatchEvent(new Event('change'));
    }
    // garantir que o modo inicie sem seleção
    setMode(null);
     
      // clicar numa linha da tabela seleciona o produto no select e mostra info
      document.querySelectorAll('.produto-row').forEach(row => {
          row.addEventListener('click', function() {
              const id = this.getAttribute('data-id');
              if (!id) return;
              produtoSelect.value = id;
              produtoSelect.dispatchEvent(new Event('change'));
            // focar campo de estoque (quantidade a adicionar) ao selecionar produto
            quantidadeInput.focus();
          });
      });
 });