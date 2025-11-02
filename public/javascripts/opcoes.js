document.addEventListener('DOMContentLoaded', function() {
    // Função segura e global para trocar seções
    function showSection(sectionId) {
        if (!sectionId) return;
        document.querySelectorAll('.option-section').forEach(sec => sec.style.display = 'none');
        const target = document.getElementById(sectionId);
        if (target) {
            target.style.display = 'block';
        }
        document.querySelectorAll('.options-sidebar .nav-link').forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector('.options-sidebar .nav-link[href="#' + sectionId + '"]');
        if (activeLink) activeLink.classList.add('active');
    }
    // expõe globalmente (mantém compatibilidade com onclick inline)
    window.showSection = showSection;

    // Anexa listeners aos links da sidebar (previne comportamento padrão do <a>)
    document.querySelectorAll('.options-sidebar .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href') || '';
            const id = href.startsWith('#') ? href.slice(1) : (this.dataset.target || '');
            showSection(id);
            // atualiza hash sem causar jump visual brusco
            if (id) history.replaceState(null, '', '#' + id);
        });
    });

    // Inicializa exibindo 'conta' (ou a hash atual, se existir)
    const initialHash = location.hash ? location.hash.slice(1) : 'conta';
    showSection(initialHash);
    
    // Simulação de troca de tema
    const themeRadios = document.querySelectorAll('input[name="tema"]');
    themeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.id === 'tema-escuro') {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
        });
    });
});