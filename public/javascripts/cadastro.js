// Seleciona os elementos
    const senhaInput = document.getElementById('senha');
    const confirmarSenhaInput = document.getElementById('confirmarSenha');
    const senhaFeedback = document.getElementById('senha-feedback');
    const confirmarSenhaFeedback = document.getElementById('confirmarSenha-feedback');

    // Validação em tempo real
    senhaInput.addEventListener('input', validarSenhas);
    confirmarSenhaInput.addEventListener('input', validarSenhas);

    // Validação no envio do formulário
    document.getElementById('formCadastro').addEventListener('submit', function(e) {
        if (!validarSenhas()) {
            e.preventDefault();
        }
    });

    function validarSenhas() {
        const senha = senhaInput.value;
        const confirmarSenha = confirmarSenhaInput.value;
        let valido = true;

        // Validação da senha (mínimo 8 caracteres)
        if (senha.length < 8) {
            senhaInput.classList.add('is-invalid');
            senhaFeedback.textContent = 'A senha deve conter pelo menos 8 caracteres';
            valido = false;
        } else {
            senhaInput.classList.remove('is-invalid');
        }

        // Validação de confirmação
        if (senha !== confirmarSenha) {
            confirmarSenhaInput.classList.add('is-invalid');
            confirmarSenhaFeedback.textContent = 'As senhas não coincidem';
            valido = false;
        } else {
            confirmarSenhaInput.classList.remove('is-invalid');
        }

        return valido;
    }

    // =========Telefone

    document.getElementById('telefone').addEventListener('input', function(e) {
    // Remove tudo que não é dígito
    let value = this.value.replace(/\D/g, '');
    
    // Aplica a máscara: (XX) 9XXXX-XXXX
    let formatted = '';
    
    // DDD (primeiros 2 dígitos)
    if (value.length > 0) {
        formatted += `(${value.substring(0, 2)}`;
    }
    
    // Fecha parêntese do DDD
    if (value.length >= 2) {
        formatted += ') ';
    }
    
    // Número do telefone (9 dígitos)
    if (value.length > 2) {
        formatted += value.substring(2, 7);
    }
    
    // Hífen para os últimos 4 dígitos
    if (value.length > 7) {
        formatted += '-' + value.substring(7, 11);
    }
    
    // Atualiza o valor do campo
    this.value = formatted;
});

//===API estados

// Função para carregar estados
async function carregarEstados() {
    const estadoSelect = document.getElementById('estado');
    
    try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        const estados = await response.json();
        
        estadoSelect.innerHTML = '<option value="" selected disabled>Selecione um estado</option>';
        
        estados.forEach(estado => {
            estadoSelect.innerHTML += `
                <option value="${estado.sigla}">${estado.nome}</option>
            `;
        });
    } catch (error) {
        console.error('Erro ao carregar estados:', error);
        estadoSelect.innerHTML = '<option value="" selected disabled>Erro ao carregar estados</option>';
    }
}

// Função para carregar cidades
async function carregarCidades(uf) {
    const cidadeSelect = document.getElementById('cidade');
    
    cidadeSelect.disabled = true;
    cidadeSelect.innerHTML = '<option value="" selected disabled>Carregando cidades...</option>';
    
    try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
        const cidades = await response.json();
        
        cidadeSelect.innerHTML = '<option value="" selected disabled>Selecione uma cidade</option>';
        
        cidades.forEach(cidade => {
            cidadeSelect.innerHTML += `
                <option value="${cidade.nome}">${cidade.nome}</option>
            `;
        });
        
        cidadeSelect.disabled = false;
    } catch (error) {
        console.error('Erro ao carregar cidades:', error);
        cidadeSelect.innerHTML = '<option value="" selected disabled>Erro ao carregar cidades</option>';
    }
}

// Evento quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    carregarEstados();
    
    // Evento quando muda o estado
    document.getElementById('estado').addEventListener('change', function() {
        const uf = this.value;
        if (uf) {
            carregarCidades(uf);
        } else {
            const cidadeSelect = document.getElementById('cidade');
            cidadeSelect.innerHTML = '<option value="" selected disabled>Selecione um estado primeiro</option>';
            cidadeSelect.disabled = true;
        }
    });
});