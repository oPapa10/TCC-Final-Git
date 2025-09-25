document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const faqItems = document.querySelectorAll('.faq-item');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const searchInput = document.getElementById('searchInput');
    const progressBar = document.getElementById('progressBar');
    const currentCategory = document.getElementById('currentCategory');
    const resultsCount = document.getElementById('resultsCount');

    // Progress Bar Animation
    function updateProgressBar() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrollTop = window.pageYOffset;
        const progress = (scrollTop / documentHeight) * 100;
        progressBar.style.width = `${progress}%`;
    }

    window.addEventListener('scroll', updateProgressBar);

    // Category Filtering
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;
            
            // Update active button
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update current category text
            const categoryText = this.querySelector('span').textContent;
            currentCategory.textContent = category === 'todas' 
                ? 'Todas as Perguntas Frequentes' 
                : `${categoryText} - Perguntas Frequentes`;
            
            // Filter questions
            filterQuestions(category);
        });
    });

    // Search Functionality
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        if (searchTerm.length > 2) {
            filterQuestions('search', searchTerm);
        } else if (searchTerm.length === 0) {
            const activeCategory = document.querySelector('.category-btn.active').dataset.category;
            filterQuestions(activeCategory);
        }
    });

    // Question Filtering
    function filterQuestions(category, searchTerm = '') {
        let visibleCount = 0;
        const categorySections = document.querySelectorAll('.category-section');

        categorySections.forEach(section => {
            const sectionCategory = section.dataset.category;
            const questions = section.querySelectorAll('.faq-item');
            let sectionVisible = false;

            questions.forEach(question => {
                const questionText = question.querySelector('h4').textContent.toLowerCase();
                const answerText = question.querySelector('.faq-answer p').textContent.toLowerCase();
                const matchesCategory = category === 'todas' || category === 'search' || sectionCategory === category;
                const matchesSearch = !searchTerm || 
                    questionText.includes(searchTerm) || 
                    answerText.includes(searchTerm);

                if (matchesCategory && matchesSearch) {
                    question.style.display = 'block';
                    visibleCount++;
                    sectionVisible = true;
                } else {
                    question.style.display = 'none';
                }
            });

            // Show/hide category header based on visible questions
            const categoryHeader = section.querySelector('.category-header');
            if (categoryHeader) {
                categoryHeader.style.display = sectionVisible ? 'flex' : 'none';
                section.style.display = sectionVisible ? 'block' : 'none';
            }
        });

        // Update results count
        resultsCount.textContent = `${visibleCount} pergunta${visibleCount !== 1 ? 's' : ''} encontrada${visibleCount !== 1 ? 's' : ''}`;
        
        // Scroll to top after filtering
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // FAQ Item Toggle
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            // Close other items in the same category
            const categorySection = item.closest('.category-section');
            const itemsInCategory = categorySection.querySelectorAll('.faq-item');
            
            itemsInCategory.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });

    // Helpful Buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('helpful-btn')) {
            const button = e.target;
            const buttonsContainer = button.parentElement;
            const allButtons = buttonsContainer.querySelectorAll('.helpful-btn');
            
            // Reset all buttons in the container
            allButtons.forEach(btn => {
                btn.innerHTML = btn.innerHTML.replace('Obrigado!', '').replace('✓', '');
                btn.style.background = '';
                btn.style.color = '';
                btn.disabled = false;
            });
            
            // Style the clicked button
            button.style.background = '#28a745';
            button.style.color = 'white';
            if (button.querySelector('.fa-thumbs-up')) {
                button.innerHTML = '<i class="fas fa-check"></i> Obrigado!';
            } else {
                button.innerHTML = '<i class="fas fa-times"></i> Obrigado!';
            }
            button.disabled = true;
        }
    });

    // Add hover effects
    function addHoverEffects() {
        const cards = document.querySelectorAll('.faq-item, .category-btn');
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
            });
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }

    // Add animation to numbers
    function animateNumbers() {
        const numbers = document.querySelectorAll('.question-number');
        numbers.forEach(number => {
            number.style.animation = 'pulse 2s infinite';
        });
    }

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);

    addHoverEffects();
    animateNumbers();

    // Initialize
    filterQuestions('todas');
});