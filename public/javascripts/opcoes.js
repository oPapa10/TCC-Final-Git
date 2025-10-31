document.addEventListener('DOMContentLoaded', function() {
    // Navegação entre seções
    const navLinks = document.querySelectorAll('.options-sidebar .nav-link');
    const sections = document.querySelectorAll('.option-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove a classe active de todos os links
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            
            // Adiciona a classe active ao link clicado
            this.classList.add('active');
            
            // Esconde todas as seções
            sections.forEach(section => {
                section.style.display = 'none';
            });
            
            // Mostra a seção correspondente
            const targetId = this.getAttribute('href');
            document.querySelector(tazzrgetId).style.display = 'block';
        });
    });
    
    // Mostra a primeira seção por padrão
    if (navLinks.length > 0) {
        navLinks[0].click();
    }
    
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