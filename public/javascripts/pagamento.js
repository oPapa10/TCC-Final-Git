document.addEventListener("DOMContentLoaded", () => {
    const numeroCartao = document.getElementById("numeroCartao");
    const validade = document.getElementById("validade");
    const cvv = document.getElementById("cvv");

    if (numeroCartao) {
        numeroCartao.addEventListener("input", () => {
            numeroCartao.value = numeroCartao.value
                .replace(/\D/g, "")
                .replace(/(\d{4})(?=\d)/g, "$1 ")
                .trim();
        });
    }

    if (validade) {
        validade.addEventListener("input", () => {
            validade.value = validade.value
                .replace(/\D/g, "")
                .replace(/(\d{2})(\d)/, "$1/$2")
                .substr(0, 5);
        });
    }

    if (cvv) {
        cvv.addEventListener("input", () => {
            cvv.value = cvv.value.replace(/\D/g, "").substr(0, 3);
        });
    }

    // Aplica tema conforme seleção armazenada (sincroniza com Opções)
    try {
        const theme = localStorage.getItem('theme');
        if (theme === 'escuro') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        // mantém sincronizado caso o usuário mude em outra aba
        window.addEventListener('storage', (e) => {
            if (e.key === 'theme') {
                if (e.newValue === 'escuro') document.body.classList.add('dark-theme');
                else document.body.classList.remove('dark-theme');
            }
        });
    } catch (e) {
        // ambiente sem localStorage — ignora
        console.warn('Tema: erro ao ler localStorage', e);
    }
});
