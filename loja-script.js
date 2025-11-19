import { db, collection, getDocs } from './firebase-config.js';

document.addEventListener("DOMContentLoaded", async () => {

    const productGrid = document.getElementById('product-grid');
    
    // Se não houver grid, não faz nada (pode estar na home)
    if (!productGrid) return;

    // 1. Limpa o conteúdo estático (carregando...)
    productGrid.innerHTML = '<div style="width:100%; text-align:center; padding:50px;">Carregando coleção...</div>';

    try {
        // 2. Busca produtos do Firebase
        const querySnapshot = await getDocs(collection(db, "produtos"));
        
        // Limpa o loading
        productGrid.innerHTML = '';
        
        if (querySnapshot.empty) {
            productGrid.innerHTML = '<p>Nenhum produto encontrado.</p>';
            return;
        }

        // 3. Cria o HTML para cada produto
        querySnapshot.forEach((doc) => {
            const produto = doc.data();
            const id = doc.id; // ID do documento no Firebase

            // Tratamento para garantir que existam dados
            const categoria = produto.categoria || 'destaques';
            const coresString = (produto.corNomes || []).join(' ').toLowerCase();
            const foto = produto.fotos ? produto.fotos[0] : 'Fotos/placeholder.jpg'; // Fallback

            // Cria o Elemento do Card
            const card = document.createElement('div');
            card.className = 'product-card';
            // Adiciona dados para o filtro funcionar
            card.setAttribute('data-category', `destaques ${categoria}`);
            card.setAttribute('data-color-names', coresString);
            
            card.innerHTML = `
                <a href="produto.html?id=${id}" class="product-card-link">
                    <div class="product-image-placeholder" style="background-image: url('${foto}');"></div>
                </a>
                <div class="product-card-content">
                    <span class="product-card-label">Cód ${id.substring(0,4)}</span> <h3><a href="produto.html?id=${id}" class="product-card-link">${produto.nome}</a></h3>
                    <p class="product-price">${produto.preco}</p>
                    <p class="product-installments">${produto.parcelas}</p>
                    <div class="product-card-footer">
                        <a href="produto.html?id=${id}" class="card-add-button">
                            <span>Ver Opções</span>
                            <i class="fas fa-plus"></i>
                        </a>
                    </div>
                </div>
            `;
            
            productGrid.appendChild(card);
        });

        // 4. REINICIA A LÓGICA DE FILTROS
        // Como criamos os elementos agora, precisamos chamar a função de filtro novamente
        inicializarFiltros();

    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        productGrid.innerHTML = '<p>Erro ao carregar produtos. Tente novamente.</p>';
    }
});

// --- Função de Filtros (Copiada e adaptada do seu script antigo para funcionar aqui) ---
function inicializarFiltros() {
    const filterTabsContainer = document.getElementById('filter-tabs');
    const searchBar = document.getElementById('search-bar');
    
    if (!filterTabsContainer) return;

    const filterTabs = filterTabsContainer.querySelectorAll('.filter-tab-btn');
    const productCards = document.querySelectorAll('.product-card'); // Seleciona os novos cards
    const sidebarCheckboxes = document.querySelectorAll('.sub-filter-checkbox');
    const colorSwatches = document.querySelectorAll('.color-filter-swatch');

    function filterProducts() {
        const searchTerm = searchBar ? searchBar.value.toLowerCase() : '';
        const activeTab = filterTabsContainer.querySelector('.filter-tab-btn.active');
        const mainCategory = activeTab ? activeTab.dataset.filter : 'destaques';

        // Sub-filtros
        const activeSubFilters = [];
        sidebarCheckboxes.forEach(cb => { if(cb.checked) activeSubFilters.push(cb.value); });

        // Filtro de Cor
        const activeColorFilters = [];
        colorSwatches.forEach(sw => { if(sw.classList.contains('selected')) activeColorFilters.push(sw.dataset.colorName); });

        productCards.forEach(card => {
            const cardCategories = card.dataset.category || '';
            const cardColorNames = card.dataset.colorNames || '';
            const productName = card.querySelector('h3').textContent.toLowerCase();

            const showsMain = (mainCategory === 'destaques') || cardCategories.includes(mainCategory);
            const showsSub = (activeSubFilters.length === 0) || activeSubFilters.some(sub => cardCategories.includes(sub));
            const showsSearch = (searchTerm === '') || productName.includes(searchTerm);
            const showsColor = (activeColorFilters.length === 0) || activeColorFilters.some(c => cardColorNames.includes(c));

            if (showsMain && showsSub && showsSearch && showsColor) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Event Listeners
    filterTabs.forEach(tab => tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        filterProducts();
    }));

    if(searchBar) searchBar.addEventListener('input', filterProducts);
    
    // Inicializa
    filterProducts();
}