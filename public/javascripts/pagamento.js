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
});
