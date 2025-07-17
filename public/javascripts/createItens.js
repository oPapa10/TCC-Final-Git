document.addEventListener('DOMContentLoaded', function() {
    // NÃO coloque nenhuma formatação manual no campo 'valor'!
    // O campo <input type="number" step="0.01" ...> já faz o trabalho corretamente.

    // Seleção múltipla de cores
    const colorOptions = document.querySelectorAll('.color-option');
    const coresInput = document.getElementById('cores');
    let coresSelecionadas = [];
    
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            this.classList.toggle('selected');
            const cor = this.getAttribute('data-value');
            
            if (this.classList.contains('selected')) {
                if (!coresSelecionadas.includes(cor)) {
                    coresSelecionadas.push(cor);
                }
            } else {
                coresSelecionadas = coresSelecionadas.filter(c => c !== cor);
            }
            
            coresInput.value = coresSelecionadas.join(', ');
        });
    });
    
    // Seleção múltipla de tamanhos
    const sizeOptions = document.querySelectorAll('.size-option');
    const tamanhosInput = document.getElementById('tamanhos');
    let tamanhosSelecionados = [];
    
    sizeOptions.forEach(option => {
        option.addEventListener('click', function() {
            this.classList.toggle('selected');
            const tamanho = this.getAttribute('data-value');
            
            if (this.classList.contains('selected')) {
                if (!tamanhosSelecionados.includes(tamanho)) {
                    tamanhosSelecionados.push(tamanho);
                }
            } else {
                tamanhosSelecionados = tamanhosSelecionados.filter(t => t !== tamanho);
            }
            
            tamanhosInput.value = tamanhosSelecionados.join(', ');
        });
    });
    
    // Controle de campos opcionais (exceto quantidade)
    document.querySelectorAll('[id^="use"]').forEach(checkbox => {
        const fieldId = checkbox.id.replace('use', '').toLowerCase();
        
        // Tratamento especial para campos compostos
        let fields = [];
        if (fieldId === 'peso') {
            fields = [document.getElementById('peso_tipo'), document.getElementById('peso_valor')];
        } else if (fieldId === 'cor') {
            fields = [document.getElementById('cores')];
        } else if (fieldId === 'tamanho') {
            fields = [document.getElementById('tamanhos')];
        } else {
            fields = [document.getElementById(fieldId)];
        }
        
        // Configurar estado inicial (campos habilitados por padrão)
        fields.forEach(field => {
            if (field) {
                field.disabled = false;
            }
        });
        
        checkbox.addEventListener('change', function() {
            fields.forEach(field => {
                if (field) {
                    field.disabled = this.checked;
                    
                    // Limpar campo quando desabilitado
                    if (this.checked) {
                        if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                            field.value = '';
                        } else if (field.tagName === 'SELECT') {
                            field.selectedIndex = 0;
                        }
                    }
                }
            });
            
            // Tratamento especial para cores e tamanhos
            if (fieldId === 'cor') {
                colorOptions.forEach(option => {
                    option.style.pointerEvents = this.checked ? 'none' : 'auto';
                    option.style.opacity = this.checked ? '0.5' : '1';
                    
                    if (this.checked) {
                        option.classList.remove('selected');
                    }
                });
                
                if (this.checked) {
                    coresSelecionadas = [];
                    coresInput.value = '';
                }
            }
            
            if (fieldId === 'tamanho') {
                sizeOptions.forEach(option => {
                    option.style.pointerEvents = this.checked ? 'none' : 'auto';
                    option.style.opacity = this.checked ? '0.5' : '1';
                    
                    if (this.checked) {
                        option.classList.remove('selected');
                    }
                });
                
                if (this.checked) {
                    tamanhosSelecionados = [];
                    tamanhosInput.value = '';
                }
            }
        });
    });
});