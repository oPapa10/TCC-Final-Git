// Atualizado: sincroniza botões com select das categorias cadastradas
document.addEventListener('DOMContentLoaded', function () {
  // campos por tipo de produto (template de campos)
  const camposPorCategoria = {
    vestuario: [
      { label: 'Marca', name: 'marca', type: 'text', required: true },
      { label: 'Modelo', name: 'modelo', type: 'text', required: false },
      { label: 'Tamanho', name: 'tamanho', type: 'text', required: true },
      { label: 'Material', name: 'material', type: 'text', required: false },
      { label: 'Cor', name: 'cor', type: 'text', required: false },
      { label: 'Descrição', name: 'descricao', type: 'textarea', required: false }
    ],
    capacete: [
      { label: 'Marca', name: 'marca', type: 'text', required: true },
      { label: 'Modelo', name: 'modelo', type: 'text', required: false },
      { label: 'Tamanho', name: 'tamanho', type: 'text', required: false },
      { label: 'Cor', name: 'cor', type: 'text', required: false },
      { label: 'Material do Casco', name: 'material_casco', type: 'text', required: false },
      { label: 'Tipo de Viseira', name: 'tipo_viseira', type: 'text', required: false },
      { label: 'Sistema de Retenção', name: 'sistema_retencao', type: 'text', required: false },
      { label: 'Peso Aproximado (g)', name: 'peso', type: 'number', required: false },
      { label: 'Certificação', name: 'certificacao', type: 'text', required: false },
      { label: 'Descrição', name: 'descricao', type: 'textarea', required: false }
    ],
    moto: [
      { label: 'Marca', name: 'marca', type: 'text', required: true },
      { label: 'Modelo', name: 'modelo', type: 'text', required: true },
      { label: 'Ano', name: 'ano', type: 'text', required: false },
      { label: 'Cilindrada', name: 'cilindrada', type: 'select', options: ['50cc', '125cc', '150cc', '160cc', '250cc', '300cc', '500cc', '600cc', '1000cc', 'Outra'], required: false },
      { label: 'Cor', name: 'cor', type: 'text', required: false },
      { label: 'Tipo de Motor', name: 'tipo_motor', type: 'select', options: ['2 tempos', '4 tempos'], required: false },
      { label: 'Sistema de Refrigeração', name: 'refrigeracao', type: 'select', options: ['Ar', 'Líquida'], required: false },
      { label: 'Tipo de Partida', name: 'partida', type: 'select', options: ['Elétrica', 'Pedal'], required: false },
      { label: 'Quilometragem', name: 'quilometragem', type: 'text', required: false },
      { label: 'Número de Marchas', name: 'marchas', type: 'text', required: false },
      { label: 'Descrição', name: 'descricao', type: 'textarea', required: false }
    ],
    oleo: [
      { label: 'Marca', name: 'marca', type: 'text', required: true },
      { label: 'Tipo de Óleo', name: 'tipo_oleo', type: 'text', required: false },
      { label: 'Viscosidade', name: 'viscosidade', type: 'text', required: false },
      { label: 'Volume da Unidade (ml)', name: 'volume_unidade', type: 'number', required: false },
      { label: 'Formato de Venda', name: 'formato_venda', type: 'text', required: false },
      { label: 'Tipo de Recipiente', name: 'tipo_recipiente', type: 'text', required: false },
      { label: 'Aplicação Recomendada', name: 'aplicacao', type: 'text', required: false },
      { label: 'Descrição', name: 'descricao', type: 'textarea', required: false }
    ],
    pecas: [
      { label: 'Tipo de Peça', name: 'tipo_peca', type: 'text', required: true },
      { label: 'Marca', name: 'marca', type: 'text', required: false },
      { label: 'Modelo Compatível', name: 'modelo_compativel', type: 'text', required: false },
      { label: 'Número da Peça (OEM)', name: 'numero_peca', type: 'text', required: false },
      { label: 'Material', name: 'material', type: 'text', required: false },
      { label: 'Dimensões (mm)', name: 'dimensoes', type: 'text', required: false },
      { label: 'Posição / Lado', name: 'posicao_lado', type: 'text', required: false },
      { label: 'Quantidade no Kit', name: 'quantidade_kit', type: 'number', required: false },
      { label: 'Garantia', name: 'garantia', type: 'text', required: false },
      { label: 'Descrição', name: 'descricao', type: 'textarea', required: false }
    ],
    outros: [] // união de todos os campos
  };

  // build 'outros' automaticamente
  (function buildGeral() {
    const mapa = new Map();
    Object.values(camposPorCategoria).forEach(lista => {
      lista.forEach(c => {
        if (!c || !c.name) return;
        const key = c.name.toString().toLowerCase();
        if (!mapa.has(key)) {
          mapa.set(key, {
            label: c.label,
            name: key,
            type: c.type,
            options: c.options,
            required: false
          });
        }
      });
    });
    camposPorCategoria.outros = Array.from(mapa.values())
      .sort((a,b) => a.label.localeCompare(b.label));
  })();

  const categoriaButtons = document.querySelectorAll('.btn-categoria');
  const infoBasicas = document.getElementById('info-basicas');
  const cardEspecificacoes = document.getElementById('card-especificacoes');
  const camposDinamicos = document.getElementById('campos-dinamicos');
  const categoriaSelect = document.getElementById('categoria_id');
  const categoriaKeyInput = document.getElementById('categoria_key');
  const productForm = document.getElementById('productForm');
  const imagemFile = document.getElementById('imagemFile');
  const imagemLink = document.getElementById('imagemLink');

  // CATEGORIA DO PRODUTO (botões superiores) - controla campos dinâmicos
  categoriaButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      // visual
      categoriaButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // mostra seções
      infoBasicas.style.display = '';
      cardEspecificacoes.style.display = '';
      
      // atualiza campos dinâmicos pelo tipo de produto
      const tipoProduto = this.dataset.key;
      categoriaKeyInput.value = tipoProduto;
      atualizarCamposDinamicos(tipoProduto);
    });
  });

  // CATEGORIA CATÁLOGO (select) - independente dos botões superiores
  categoriaSelect?.addEventListener('change', function () {
    updateSelectEmptyClass();
  });

  // FUNÇÕES AUXILIARES

  function limparCamposDinamicos() { 
    camposDinamicos.innerHTML = ''; 
  }

  function gerarCampo(campo) {
    const wrapper = document.createElement('div');
    wrapper.className = 'campo-dinamico fade-in';
    const req = campo.required ? 'required' : '';
    
    if (campo.type === 'textarea') {
      const maxChars = 2000; // Limite para descrição
      wrapper.innerHTML = `
        <label class="form-label" for="${campo.name}">${campo.label}</label>
        <textarea id="${campo.name}" name="${campo.name}" class="form-control" ${req} rows="3" maxlength="${maxChars}" data-maxchars="${maxChars}"></textarea>
        <div class="form-text">
          <span id="char-count-${campo.name}">0</span>/<span>${maxChars}</span> caracteres
        </div>
      `;
      
      // Adiciona listener de contagem
      setTimeout(() => {
        const textarea = document.getElementById(campo.name);
        if (textarea) {
          textarea.addEventListener('input', function() {
            const contador = document.getElementById(`char-count-${campo.name}`);
            if (contador) {
              contador.textContent = this.value.length;
              // Muda cor quando próximo do limite
              if (this.value.length > maxChars * 0.9) {
                contador.parentElement.style.color = '#dc3545';
              } else {
                contador.parentElement.style.color = '#6c757d';
              }
            }
          });
        }
      }, 0);
      
    } else if (campo.type === 'select') {
      wrapper.innerHTML = `
        <label class="form-label" for="${campo.name}">${campo.label}</label>
        <select id="${campo.name}" name="${campo.name}" class="form-control" ${req}>
          <option value="">Selecione...</option>
          ${campo.options ? campo.options.map(o => `<option value="${o}">${o}</option>`).join('') : ''}
        </select>
      `;
    } else {
      wrapper.innerHTML = `
        <label class="form-label" for="${campo.name}">${campo.label}</label>
        <input id="${campo.name}" name="${campo.name}" type="${campo.type}" class="form-control" ${req}>
      `;
    }
    return wrapper;
  }

  function atualizarCamposDinamicos(tipoProduto) {
    limparCamposDinamicos();
    const lista = camposPorCategoria[tipoProduto] || [];
    if (!lista.length) return;
    
    const row = document.createElement('div');
    row.className = 'row';
    
    lista.forEach(campo => {
      const col = document.createElement('div');
      col.className = campo.type === 'textarea' ? 'col-12 mb-3' : 'col-md-6 mb-3';
      col.appendChild(gerarCampo(campo));
      row.appendChild(col);
    });
    
    camposDinamicos.appendChild(row);
  }

  function updateSelectEmptyClass() {
    if (!categoriaSelect) return;
    categoriaSelect.classList.toggle('empty', !categoriaSelect.value);
    categoriaSelect.style.backgroundColor = '#ffffff';
    categoriaSelect.style.color = '#212529';
  }

  // IMAGENS: toggle file x link
  function toggleMainImageInputs() {
    if (!imagemFile || !imagemLink) return;
    const temFile = imagemFile.files && imagemFile.files.length > 0;
    const temLink = imagemLink.value && imagemLink.value.trim() !== '';
    
    imagemLink.disabled = temFile;
    imagemFile.disabled = temLink;
    
    if (temFile) {
      imagemLink.value = '';
      imagemLink.placeholder = 'Desabilitado (arquivo selecionado)';
    } else {
      imagemLink.placeholder = 'https://exemplo.com/imagem.jpg';
    }
  }
  
  imagemFile?.addEventListener('change', toggleMainImageInputs);
  imagemLink?.addEventListener('input', toggleMainImageInputs);

  // VALIDAÇÃO ANTES DE ENVIAR
  productForm?.addEventListener('submit', function (e) {
    // categoria do catálogo obrigatória
    if (!categoriaSelect || !categoriaSelect.value) {
      e.preventDefault();
      alert('Selecione uma categoria do catálogo antes de cadastrar o produto.');
      return;
    }

    // template de produto (botão superior) obrigatório
    if (!categoriaKeyInput.value) {
      e.preventDefault();
      alert('Selecione um tipo de produto (botões superiores) antes de cadastrar.');
      return;
    }

    // imagem principal obrigatória
    const temFile = imagemFile && imagemFile.files && imagemFile.files.length > 0;
    const temLink = imagemLink && imagemLink.value && imagemLink.value.trim() !== '';
    if (!temFile && !temLink) {
      e.preventDefault();
      alert('Informe a imagem principal: faça upload ou insira um link.');
      return;
    }

    // campos básicos
    const nomeInput = document.getElementById('nome');
    const valorInput = document.getElementById('valor');
    
    if (!nomeInput.value.trim()) {
      e.preventDefault();
      nomeInput.classList.add('is-invalid');
      alert('Informe o nome do produto.');
      return;
    }
    
    if (!valorInput.value || parseFloat(valorInput.value) <= 0) {
      e.preventDefault();
      valorInput.classList.add('is-invalid');
      alert('Informe um valor válido.');
      return;
    }

    // campos dinâmicos obrigatórios
    const obrigatorios = camposDinamicos.querySelectorAll('[required]');
    let temErro = false;
    
    obrigatorios.forEach(campo => {
      if (!campo.value || campo.value.toString().trim() === '') {
        campo.classList.add('is-invalid');
        temErro = true;
      } else {
        campo.classList.remove('is-invalid');
      }
    });

    if (temErro) {
      e.preventDefault();
      alert('Preencha todos os campos obrigatórios nas especificações do produto.');
    }
  });

  // INICIALIZAÇÃO
  infoBasicas.style.display = 'none';
  cardEspecificacoes.style.display = 'none';
  updateSelectEmptyClass();
});