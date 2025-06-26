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
            answer: 'Aceitamos as seguintes formas de pagamento:<br><br>- Cartões de crédito (Visa, Mastercard, American Express, Elo)<br>- Débito online (Itaú, Bradesco, Banco do Brasil)<br>- Pix (pagamento instantâneo com desconto)<br>- Boleto bancário'
        },
        {
            id: 'parcelamento',
            question: 'Posso parcelar minha compra?',
            answer: 'Sim, para pagamentos com cartão de crédito oferecemos parcelamento em até 12x sem juros (para compras acima de R$300) ou em até 6x sem juros para valores menores. O valor mínimo da parcela é R$50,00.'
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
    // Aqui você pode implementar o envio dessa avaliação para seu sistema
    if (wasHelpful) {
        alert('Obrigado pelo seu feedback! Ficamos felizes em ajudar.');
    } else {
        alert('Lamentamos não ter ajudado. Entraremos em contato para melhorar nosso atendimento.');
    }
}

// Funções para o chat e e-mail (simulação)
function openChat() {
    alert('Abrindo chat de atendimento... Nosso horário de funcionamento é de segunda a sexta, das 8h às 18h.');
}

function showEmailForm() {
    alert('Redirecionando para o formulário de contato por e-mail...');
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Pode adicionar inicializações aqui se necessário
});