// Banco de dados de perguntas e respostas
const faqDatabase = {
    pedidos: [
        {
            id: 'como-rastrear',
            question: 'Como posso rastrear meu pedido?',
            answer: 'Assim que seu pedido for enviado, você receberá um e-mail com o código de rastreamento. Você pode acompanhar o status do seu pedido em nossa página de rastreamento ou diretamente no site dos Correios utilizando o código fornecido.'
        },
        {
            id: 'prazo-entrega',
            question: 'Qual o prazo de entrega?',
            answer: 'O prazo de entrega varia conforme sua localização e o método de envio escolhido. Para entregas padrão:<br><br>- Capitais: 3 a 5 dias úteis<br>- Interior: 5 a 10 dias úteis<br><br>Pedidos feitos até as 12h são processados no mesmo dia útil.'
        },
        {
            id: 'status-pedido',
            question: 'Como verificar o status do meu pedido?',
            answer: 'Você pode verificar o status do seu pedido acessando "Minha Conta" > "Meus Pedidos" em nosso site. Lá você encontrará todas as informações atualizadas sobre o processamento e envio do seu pedido.'
        },
        {
            id: 'prazo-retirada',
            question: 'Qual o prazo para a retirada dos itens?',
            answer: 'Após a confirmação do pagamento, o prazo para retirada ou entrega é informado no ato da compra — geralmente entre 5 a 8 dias úteis. Todos os veículos são entregues lavados, revisados e prontos para uso.'
        }
    ],
    pagamentos: [
        {
            id: 'seguranca-pagamento',
            question: 'O pagamento no site é seguro?',
            answer: 'Sim, nossa plataforma utiliza os mais avançados sistemas de criptografia para garantir a segurança de seus dados. Trabalhamos com gateways de pagamento certificados e não armazenamos informações de cartão de crédito em nossos servidores.'
        },
        {
            id: 'formas-pagamento',
            question: 'Quais formas de pagamento são aceitas?',
            answer: 'Aceitamos as seguintes formas de pagamento:<br><br>- Cartões de crédito (Visa, Mastercard, American Express, Elo)<br>- Débito online (Itaú, Bradesco, Banco do Brasil)<br>- Pix (pagamento instantâneo com desconto)<br>- Boleto bancário<br>- Pagamento à vista<br><br>Para pagamentos com cartão de crédito, oferecemos parcelamento em até 12x.'
        },
        {
            id: 'parcelamento',
            question: 'Posso parcelar minha compra?',
            answer: 'Sim, para pagamentos com cartão de crédito oferecemos parcelamento em até 12x sem juros (para compras acima de R$300) ou em até 6x sem juros para valores menores. O valor mínimo da parcela é R$50,00.'
        },
        {
            id: 'negociacao-preco',
            question: 'Na loja pode negociar o preço?',
            answer: 'Na loja física, é possível negociar valores diretamente com nossos consultores. No site, os preços exibidos são fixos, mas sempre oferecemos promoções e condições especiais. Acompanhe nossas promoções regularmente!'
        }
    ],
    trocas: [
        {
            id: 'prazo-devolucao',
            question: 'Qual o prazo para devolução?',
            answer: 'Você tem até 7 dias corridos após o recebimento do produto para solicitar a devolução por arrependimento. Para produtos com defeito, o prazo é de 30 dias corridos. Lembre-se de manter a embalagem original e a nota fiscal.'
        },
        {
            id: 'como-trocar',
            question: 'Como solicitar uma troca?',
            answer: 'Para solicitar uma troca:<br>1. Acesse "Minha Conta" > "Trocas e Devoluções"<br>2. Selecione o pedido e o item que deseja trocar<br>3. Preencha o formulário com o motivo da troca<br>4. Nossa equipe entrará em contato com as instruções para envio do produto'
        },
        {
            id: 'custos-devolucao',
            question: 'Quem paga o frete da devolução?',
            answer: 'Em casos de arrependimento, o frete de devolução fica por conta do cliente. Para produtos com defeito ou trocas por erro nosso, nós cobrimos todos os custos de envio. Disponibilizamos etiquetas pré-pagas nestes casos.'
        },
        {
            id: 'troca-veiculo',
            question: 'Na loja tem sistema de troca de veículo?',
            answer: 'Sim! Aceitamos seu veículo usado como parte do pagamento após avaliação. Entre em contato com nossa equipe para agendar uma avaliação gratuita e sem compromisso do seu veículo.'
        }
    ],
    cadastro: [
        {
            id: 'recuperar-senha',
            question: 'Como recuperar minha senha?',
            answer: 'Na página de login, clique em "Esqueci minha senha". Você receberá um e-mail com um link para criar uma nova senha. Caso não receba o e-mail em alguns minutos, verifique sua pasta de spam.'
        },
        {
            id: 'alterar-dados',
            question: 'Como alterar meus dados cadastrais?',
            answer: 'Acesse "Minha Conta" > "Dados Pessoais". Lá você pode atualizar suas informações de contato, endereço e preferências. Algumas alterações podem requerer confirmação por e-mail ou SMS por questões de segurança.'
        },
        {
            id: 'excluir-conta',
            question: 'Como excluir minha conta?',
            answer: 'Para excluir sua conta permanentemente, envie uma solicitação para nosso atendimento através do formulário de contato. Todos os seus dados pessoais serão removidos de nossos sistemas em até 72 horas, conforme nossa Política de Privacidade.'
        }
    ],
    garantia: [
        {
            id: 'tempo-garantia',
            question: 'Qual o tempo de garantia dos produtos?',
            answer: 'Todos os produtos possuem garantia de 12 meses contra defeitos de fabricação.'
        },
        {
            id: 'o-que-cobre-garantia',
            question: 'O que cobre a garantia?',
            answer: 'A garantia cobre defeitos de fabricação e problemas mecânicos que não sejam causados por mau uso ou desgaste natural. Produtos e acessórios também possuem garantia conforme o fabricante.'
        },
        {
            id: 'acionar-garantia',
            question: 'Como acionar a garantia?',
            answer: 'Basta entrar em contato com nossa equipe de atendimento informando o número da compra e o problema identificado. Nossa equipe orientará o processo de análise e solução.'
        },
        {
            id: 'garantia-acessorios',
            question: 'Há garantia para itens que não são motos?',
            answer: 'Sim. Produtos e acessórios também possuem garantia conforme o fabricante.'
        }
    ],
    veiculos: [
        {
            id: 'favoritos',
            question: 'Vai ter itens favoritos?',
            answer: 'No momento, o site ainda não possui a opção de favoritar veículos, mas essa funcionalidade poderá ser adicionada em futuras atualizações. Fique atento aos nossos anúncios!'
        },
        {
            id: 'test-drive',
            question: 'As motos têm test drive?',
            answer: 'Sim, oferecemos test drives mediante agendamento prévio. Basta entrar em contato com a loja para marcar um horário. Nossa equipe está pronta para facilitar sua experiência!'
        },
        {
            id: 'historico-veiculo',
            question: 'Na loja os veículos têm histórico completo?',
            answer: 'Sim. Todos os veículos possuem histórico completo, com informações sobre revisões, quilometragem e procedência. Transparência é nossa prioridade!'
        },
        {
            id: 'revisao-antes-venda',
            question: 'Na loja os veículos são revisados antes da venda?',
            answer: 'Sim. Todos os veículos passam por uma revisão completa antes de serem colocados à venda, garantindo qualidade e segurança.'
        },
        {
            id: 'revisao-pos-venda',
            question: 'Na loja existe revisão pós-venda?',
            answer: 'No momento não oferecemos revisão pós-venda, mas todos os veículos passam por uma revisão completa antes da entrega, garantindo qualidade e segurança.'
        },
        {
            id: 'veiculo-entrega',
            question: 'Na loja o veículo é entregue lavado e revisado?',
            answer: 'Sim. Todos os veículos são entregues lavados, revisados e prontos para uso. Você receberá um veículo em perfeito estado!'
        },
        {
            id: 'documentacao-dia',
            question: 'Na loja todos os veículos possuem documentação em dia?',
            answer: 'Sim. Todos os veículos são vendidos com documentação 100% regularizada e pronta para transferência.'
        },
        {
            id: 'ajuda-transferencia',
            question: 'Na loja ajudam na transferência do documento?',
            answer: 'A transferência deve ser feita diretamente pelo comprador, porém nossa equipe fornece todas as orientações necessárias para facilitar o processo junto ao Detran.'
        },
        {
            id: 'prazo-transferencia',
            question: 'Na loja quanto tempo sai a transferência da moto?',
            answer: 'O prazo varia conforme o Detran de cada estado, mas normalmente o processo é concluído em até 5 dias úteis após a compra.'
        }
    ],
    avaliacoes: [
        {
            id: 'avaliacao-veiculo',
            question: 'Na loja fazem avaliação sem compromisso?',
            answer: 'Sim. Fazemos avaliações gratuitas e sem compromisso para que você conheça o valor do seu veículo. Entre em contato conosco para agendar sua avaliação!'
        }
    ]
};

let lastOrigin = 'home'; // 'home' ou 'category'

// Função para exibir perguntas de uma categoria
function showQuestions(category) {
    lastOrigin = 'category';
    const questionsContainer = document.getElementById('questionsContainer');
    const categoryTitle = document.getElementById('categoryTitle');
    const welcomeMessage = document.querySelector('.welcome-message');
    const questionsList = document.getElementById('questionsList');
    const answerContainer = document.getElementById('answerContainer');

    // Esconde mensagem de boas-vindas e mostra lista de perguntas
    welcomeMessage.style.display = 'none';
    questionsList.style.display = 'block';
    answerContainer.style.display = 'none';

    // Define o título da categoria
    let title = '';
    switch(category) {
        case 'pedidos': title = 'Pedidos e Entregas'; break;
        case 'pagamentos': title = 'Pagamentos'; break;
        case 'trocas': title = 'Trocas e Devoluções'; break;
        case 'cadastro': title = 'Cadastro e Conta'; break;
        case 'garantia': title = 'Garantia'; break;
        case 'veiculos': title = 'Sobre Veículos'; break;
        case 'avaliacoes': title = 'Avaliações'; break;
    }
    categoryTitle.textContent = title;

    // Limpa o container de perguntas
    questionsContainer.innerHTML = '';

    // Adiciona cada pergunta ao container como item do Bootstrap
    faqDatabase[category].forEach(item => {
        const questionElement = document.createElement('button');
        questionElement.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center mb-2';
        questionElement.innerHTML = `
            <span>${item.question}</span>
            <i class="fas fa-chevron-right"></i>
        `;
        questionElement.onclick = () => showAnswer(item.id);
        questionsContainer.appendChild(questionElement);
    });
}

// Função para exibir uma resposta específica
function showAnswer(questionId, origin = 'category') {
    lastOrigin = origin;
    const questionsList = document.getElementById('questionsList');
    const answerContainer = document.getElementById('answerContainer');
    const questionTitle = document.getElementById('questionTitle');
    const answerContent = document.getElementById('answerContent');
    
    // Encontra a pergunta no banco de dados
    let foundQuestion = null;
    for (const category in faqDatabase) {
        foundQuestion = faqDatabase[category].find(q => q.id === questionId);
        if (foundQuestion) break;
    }
    
    if (foundQuestion) {
        // Atualiza o conteúdo da resposta
        questionTitle.textContent = foundQuestion.question;
        answerContent.innerHTML = foundQuestion.answer;
        
        // Alterna a exibição
        questionsList.style.display = 'none';
        answerContainer.style.display = 'block';
    }
}

// Função para voltar à lista de perguntas
function backToQuestions() {
    document.getElementById('answerContainer').style.display = 'none';
    if (lastOrigin === 'home') {
        document.querySelector('.welcome-message').style.display = 'block';
        document.getElementById('questionsList').style.display = 'none';
    } else {
        document.getElementById('questionsList').style.display = 'block';
    }
}

// Função para voltar ao início (perguntas frequentes)
function backToHome() {
    document.querySelector('.welcome-message').style.display = 'block';
    document.getElementById('questionsList').style.display = 'none';
    document.getElementById('answerContainer').style.display = 'none';
}

// Função para avaliar se a resposta foi útil
function rateHelpful(wasHelpful) {
    const modalHTML = `
        <div class="modal fade" id="feedbackModal" tabindex="-1" aria-labelledby="feedbackLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg">
                    <div class="modal-header ${wasHelpful ? 'bg-success' : 'bg-warning'} text-white border-0">
                        <h5 class="modal-title" id="feedbackLabel">
                            <i class="fas ${wasHelpful ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2"></i>
                            ${wasHelpful ? 'Feedback Positivo' : 'Feedback Negativo'}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center py-4">
                        <div class="mb-3">
                            <i class="fas ${wasHelpful ? 'fa-smile-wink' : 'fa-frown'} fa-3x ${wasHelpful ? 'text-success' : 'text-warning'}"></i>
                        </div>
                        <p class="fs-5 mb-0">
                            ${wasHelpful 
                                ? '✨ Ótimo! Ficamos felizes em ajudar. Sua opinião é muito importante para nós!' 
                                : '😞 Lamentamos não ter ajudado. Vamos melhorar nosso atendimento.'}
                        </p>
                    </div>
                    <div class="modal-footer border-0 bg-light">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Fechar</button>
                        ${!wasHelpful ? '<button type="button" class="btn btn-primary" onclick="openSupportForm()"><i class="fas fa-envelope me-2"></i>Contatar Suporte</button>' : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove modal anterior se existir
    const existingModal = document.getElementById('feedbackModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Adiciona novo modal ao body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Mostra o modal
    const feedbackModal = new bootstrap.Modal(document.getElementById('feedbackModal'));
    feedbackModal.show();

    // Remove o modal do DOM quando fechado
    document.getElementById('feedbackModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Função para abrir formulário de suporte
function openSupportForm() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('feedbackModal'));
    modal.hide();
    
    const supportFormHTML = `
        <div class="modal fade" id="supportFormModal" tabindex="-1" aria-labelledby="supportFormLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg">
                    <div class="modal-header bg-primary text-white border-0">
                        <h5 class="modal-title" id="supportFormLabel">
                            <i class="fas fa-headset me-2"></i>Entre em Contato
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body py-4">
                        <form id="supportForm">
                            <div class="mb-3">
                                <label for="supportEmail" class="form-label">Seu E-mail</label>
                                <input type="email" class="form-control" id="supportEmail" placeholder="seu@email.com" required>
                            </div>
                            <div class="mb-3">
                                <label for="supportMessage" class="form-label">Descreva seu problema</label>
                                <textarea class="form-control" id="supportMessage" rows="4" placeholder="Nos conte o que não funcionou..." required></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer border-0 bg-light">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="submitSupportForm()">
                            <i class="fas fa-paper-plane me-2"></i>Enviar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', supportFormHTML);
    const supportFormModal = new bootstrap.Modal(document.getElementById('supportFormModal'));
    supportFormModal.show();
}

// Função para enviar formulário de suporte
function submitSupportForm() {
    const email = document.getElementById('supportEmail').value;
    const message = document.getElementById('supportMessage').value;

    if (!email || !message) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    // Aqui você pode enviar os dados para seu servidor
    console.log('Email de suporte enviado:', { email, message });

    // Fecha o modal de formulário
    bootstrap.Modal.getInstance(document.getElementById('supportFormModal')).hide();

    // Mostra mensagem de sucesso
    const successHTML = `
        <div class="modal fade" id="successModal" tabindex="-1" aria-labelledby="successLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg">
                    <div class="modal-body text-center py-5">
                        <div class="mb-3">
                            <i class="fas fa-check-circle fa-4x text-success"></i>
                        </div>
                        <h5 class="mb-2">Mensagem Enviada com Sucesso!</h5>
                        <p class="text-muted">Nossa equipe entrará em contato em breve.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', successHTML);
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    successModal.show();

    setTimeout(() => {
        successModal.hide();
        document.getElementById('successModal').remove();
    }, 3000);
}

// Funções para o chat e e-mail (simulação)
function openChat() {
    alert('Abrindo chat de atendimento... Nosso horário de funcionamento é de segunda a sexta, das 8h às 18h.');
}

// Função para abrir formulário de contato por e-mail
function showEmailForm() {
    // Tenta obter dados do usuário logado (do sessionStorage ou variável global)
    const usuarioLogado = window.usuarioLogado || JSON.parse(sessionStorage.getItem('usuarioLogado') || '{}');
    const nomePreenchido = usuarioLogado.nome || '';
    const emailPreenchido = usuarioLogado.email || '';

    const emailFormHTML = `
        <div class="modal fade" id="emailFormModal" tabindex="-1" aria-labelledby="emailFormLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg">
                    <div class="modal-header bg-info text-white border-0">
                        <h5 class="modal-title" id="emailFormLabel">
                            <i class="fas fa-envelope me-2"></i>Envie-nos um E-mail
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body py-4">
                        <p class="text-muted mb-3">
                            <i class="fas fa-info-circle me-2"></i>
                            Preencha o formulário abaixo e nossa equipe entrará em contato em breve. 
                            Respondemos em até 24 horas.
                        </p>
                        <form id="emailContactForm">
                            <div class="mb-3">
                                <label for="contactName" class="form-label">
                                    <i class="fas fa-user me-2"></i>Seu Nome
                                </label>
                                <input type="text" class="form-control" id="contactName" placeholder="Seu nome completo" value="${nomePreenchido}" required>
                                <small class="text-muted">${nomePreenchido ? '✓ Pré-preenchido' : ''}</small>
                            </div>
                            <div class="mb-3">
                                <label for="contactEmail" class="form-label">
                                    <i class="fas fa-envelope me-2"></i>Seu E-mail
                                </label>
                                <input type="email" class="form-control" id="contactEmail" placeholder="seu@email.com" value="${emailPreenchido}" required>
                                <small class="text-muted">${emailPreenchido ? '✓ Pré-preenchido' : ''}</small>
                            </div>
                            <div class="mb-3">
                                <label for="contactSubject" class="form-label">
                                    <i class="fas fa-heading me-2"></i>Assunto
                                </label>
                                <select class="form-control" id="contactSubject" required>
                                    <option value="">Selecione um assunto...</option>
                                    <option value="duvida">Dúvida sobre produto</option>
                                    <option value="problema">Problema com pedido</option>
                                    <option value="sugestao">Sugestão ou feedback</option>
                                    <option value="reclamacao">Reclamação</option>
                                    <option value="outro">Outro</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="contactMessage" class="form-label">
                                    <i class="fas fa-comment me-2"></i>Mensagem
                                </label>
                                <textarea class="form-control" id="contactMessage" rows="4" placeholder="Digite sua mensagem..." required></textarea>
                                <small class="text-muted d-block mt-2">
                                    <span id="charCount">0</span>/500 caracteres
                                </small>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer border-0 bg-light">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-info text-white" onclick="submitEmailForm()">
                            <i class="fas fa-paper-plane me-2"></i>Enviar E-mail
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove modal anterior se existir
    const existingModal = document.getElementById('emailFormModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Adiciona novo modal ao body
    document.body.insertAdjacentHTML('beforeend', emailFormHTML);

    // Contador de caracteres
    const messageField = document.getElementById('contactMessage');
    const charCountSpan = document.getElementById('charCount');
    
    messageField.addEventListener('input', function() {
        charCountSpan.textContent = this.value.length;
        if (this.value.length > 450) {
            charCountSpan.style.color = '#ff6b6b';
        } else {
            charCountSpan.style.color = '#6c757d';
        }
    });

    // Mostra o modal
    const emailFormModal = new bootstrap.Modal(document.getElementById('emailFormModal'));
    emailFormModal.show();

    // Remove o modal do DOM quando fechado
    document.getElementById('emailFormModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Função para enviar formulário de e-mail
function submitEmailForm() {
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value;

    if (!name || !email || !subject || !message) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    // Aqui você pode enviar os dados para seu servidor
    console.log('E-mail de contato enviado:', { name, email, subject, message });

    // Fecha o modal de formulário
    bootstrap.Modal.getInstance(document.getElementById('emailFormModal')).hide();

    // Mostra mensagem de sucesso
    const successHTML = `
        <div class="modal fade" id="emailSuccessModal" tabindex="-1" aria-labelledby="emailSuccessLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg">
                    <div class="modal-body text-center py-5">
                        <div class="mb-3">
                            <i class="fas fa-check-circle fa-4x text-info"></i>
                        </div>
                        <h5 class="mb-2">E-mail Enviado com Sucesso!</h5>
                        <p class="text-muted">Obrigado por entrar em contato. Nossa equipe responderá em breve.</p>
                        <div class="mt-3 p-3 bg-light rounded">
                            <small class="text-muted">
                                <strong>Seu e-mail:</strong> <span id="confirmEmail"></span>
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', successHTML);
    document.getElementById('confirmEmail').textContent = email;
    const successModal = new bootstrap.Modal(document.getElementById('emailSuccessModal'));
    successModal.show();

    setTimeout(() => {
        successModal.hide();
        document.getElementById('emailSuccessModal').remove();
    }, 4000);
}

// Função para buscar perguntas
function buscarPerguntas(texto) {
    texto = texto.toLowerCase();
    let resultados = [];
    for (const categoria in faqDatabase) {
        faqDatabase[categoria].forEach(item => {
            if (item.question.toLowerCase().includes(texto) || item.answer.toLowerCase().includes(texto)) {
                resultados.push(item);
            }
        });
    }
    // Exemplo: mostrar resultados em um modal ou lista
    mostrarResultadosBusca(resultados);
}

function mostrarResultadosBusca(resultados) {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';
    resultados.forEach(item => {
        const questionElement = document.createElement('button');
        questionElement.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center mb-2';
        questionElement.innerHTML = `
            <span>${item.question}</span>
            <i class="fas fa-chevron-right"></i>
        `;
        questionElement.onclick = () => showAnswer(item.id);
        container.appendChild(questionElement);
    });
    document.querySelector('.welcome-message').style.display = 'none';
    document.getElementById('questionsList').style.display = 'block';
    document.getElementById('answerContainer').style.display = 'none';
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Pode adicionar inicializações aqui se necessário
});