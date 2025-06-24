document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('categoryForm');
    const categoryList = document.getElementById('categoryList');
    const emptyState = document.getElementById('emptyState');
    
    // Verificar se há categorias salvas no localStorage
    let categories = JSON.parse(localStorage.getItem('categories')) || [];
    
    // Atualizar a lista de categorias
    function updateCategoryList() {
        categoryList.innerHTML = '';
        
        if (categories.length === 0) {
            emptyState.style.display = 'block';
            // Remove o exemplo se houver categorias reais
            const exampleItem = categoryList.querySelector('.category-item');
            if (exampleItem) exampleItem.remove();
        } else {
            emptyState.style.display = 'none';
            
            categories.forEach((category, index) => {
                const li = document.createElement('li');
                li.className = 'category-item';
                li.style.borderLeftColor = category.color;
                
                li.innerHTML = `
                    <div>
                        <span class="category-name">${category.name}</span>
                        ${category.description ? `<p>${category.description}</p>` : ''}
                    </div>
                    <div class="category-actions">
                        <button class="action-btn" onclick="editCategory(${index})">✏️</button>
                        <button class="action-btn" onclick="deleteCategory(${index})">🗑️</button>
                    </div>
                `;
                
                categoryList.appendChild(li);
            });
        }
    }
    
    // Adicionar nova categoria
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('categoryName').value;
        const description = document.getElementById('categoryDescription').value;
        const color = document.getElementById('categoryColor').value;
        
        const newCategory = {
            name,
            description,
            color
        };
        
        categories.push(newCategory);
        localStorage.setItem('categories', JSON.stringify(categories));
        
        updateCategoryList();
        form.reset();
    });
    
    // Carregar categorias ao iniciar
    updateCategoryList();
});

// Funções globais para editar e excluir
function editCategory(index) {
    const categories = JSON.parse(localStorage.getItem('categories')) || [];
    const category = categories[index];
    
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryDescription').value = category.description || '';
    document.getElementById('categoryColor').value = category.color;
    
    categories.splice(index, 1);
    localStorage.setItem('categories', JSON.stringify(categories));
    
    // Atualiza a lista
    document.getElementById('categoryList').innerHTML = '';
    const emptyState = document.getElementById('emptyState');
    if (categories.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
    }
}

function deleteCategory(index) {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
        const categories = JSON.parse(localStorage.getItem('categories')) || [];
        categories.splice(index, 1);
        localStorage.setItem('categories', JSON.stringify(categories));
        
        // Atualiza a lista
        document.getElementById('categoryList').innerHTML = '';
        const emptyState = document.getElementById('emptyState');
        if (categories.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
        }
        
        // Recarrega as categorias restantes
        categories.forEach((category, idx) => {
            const li = document.createElement('li');
            li.className = 'category-item';
            li.style.borderLeftColor = category.color;
            
            li.innerHTML = `
                <div>
                    <span class="category-name">${category.name}</span>
                    ${category.description ? `<p>${category.description}</p>` : ''}
                </div>
                <div class="category-actions">
                    <button class="action-btn" onclick="editCategory(${idx})">✏️</button>
                    <button class="action-btn" onclick="deleteCategory(${idx})">🗑️</button>
                </div>
            `;
            
            document.getElementById('categoryList').appendChild(li);
        });
    }
}