import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.12.0/+esm";

const supabaseUrl = "https://akpmbgyrnoqvgegwnciz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrcG1iZ3lybm9xdmdlZ3duY2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NzE5NDAsImV4cCI6MjA1MDI0Nzk0MH0.mbN5DB16tfc_iQ6-chS2dUI7-0wc23KWQB-TcWib4t8";
const supabase = createClient(supabaseUrl, supabaseKey);

const PAGE_SIZE = 42;
let currentPage = 1;
let totalProducts = 0;
let currentCategory = "";
let currentSearchQuery = "";

async function fetchProductsByCategory(category, page = 1) {
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE - 1;

    let query = supabase
        .from("produtos")
        .select("*", { count: 'exact' });

    if (currentSearchQuery) {
        query = query.ilike('nome', `%${currentSearchQuery}%`);
    } else {
        query = query.eq("categoria", category);
    }

    const { data, count, error } = await query.range(startIndex, endIndex);

    if (error) {
        console.error("Erro ao buscar produtos:", error);
        document.getElementById("searchMessage").textContent =
            "Erro ao carregar produtos. Por favor, recarregue a página.";
        return { products: [], total: 0 };
    }

    const products = data.map((product) => ({
        id: product.id,
        name: product.nome,
        price: `R$${parseFloat(product.preco).toFixed(2)}`,
        size: product.tamanho,
        image: product.imagem_url,
        images: product.imagens_url ? product.imagens_url.split(", ") : [],
        category: product.categoria,
        readyToShip: product.pronta_entrega || false
    }));

    return { products, total: count };
}

async function displayProducts(page = 1) {
    const grid = document.getElementById("productGrid");
    const message = document.getElementById("searchMessage");
    const searchInfo = document.getElementById("searchInfo");
    const searchTerm = document.getElementById("searchTerm");

    grid.innerHTML = "<div class='col-span-full text-center py-8'><i class='fas fa-spinner fa-spin fa-2x'></i></div>";

    const { products, total } = await fetchProductsByCategory(currentCategory, page);
    totalProducts = total;
    currentPage = page;
    grid.innerHTML = "";

    if (currentSearchQuery) {
        searchInfo.classList.remove("hidden");
        searchTerm.textContent = currentSearchQuery;
    } else {
        searchInfo.classList.add("hidden");
    }

    if (products.length === 0) {
        message.textContent = currentSearchQuery
            ? `Nenhum produto encontrado para "${currentSearchQuery}"`
            : "Não encontramos produtos nesta categoria.";
        grid.innerHTML = `
            <div class="col-span-full text-center py-8">
                <i class="fas fa-search fa-2x mb-4 text-gray-400"></i>
                <p class="text-gray-600">Nenhum produto encontrado.</p>
            </div>
        `;
        renderPagination();
        return;
    } else {
        message.textContent = "";
    }

    products.forEach((product) => {
        const valorComAcrescimo = parseFloat(product.price.replace("R$", "")) * 1.08;
        const valorParcela = (valorComAcrescimo / 6).toFixed(2);

        const productItem = document.createElement('div');
        productItem.className = 'border rounded-lg overflow-hidden relative hover:shadow-md transition-shadow';
        productItem.innerHTML = `
            ${product.readyToShip ?
                '<div class="pronta-entrega-balao">Pronta Entrega</div>' :
                ''}
            <div class="relative">
                <img src="${product.images.length > 0 ? product.images[0] : product.image}" 
                    alt="${product.name}" 
                    class="w-full h-48 object-cover"
                    loading="lazy">
                <button class="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black text-white p-2 rounded-full hover:bg-gray-800 transition" 
                        data-id="${product.id}"
                        aria-label="Comprar ${product.name}">
                    <i class="fas fa-shopping-bag"></i>
                </button>
            </div>
            <div class="p-4 text-center">
                <h2 class="text-lg font-semibold truncate">${product.name}</h2>
                <p class="text-xl font-bold">${product.price}</p>
                <p class="text-sm text-gray-500">6x de <span class="text-blue-600">R$${valorParcela}</span></p>
            </div>
        `;

        productItem.querySelector('button[data-id]').addEventListener('click', () => {
            const productId = productItem.querySelector('button').getAttribute('data-id');
            window.location.href = `produto.html?id=${productId}`;
        });

        grid.appendChild(productItem);
    });

    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(totalProducts / PAGE_SIZE);
    const paginationContainer = document.getElementById("paginationContainer") || document.createElement('div');
    paginationContainer.id = "paginationContainer";
    paginationContainer.className = "pagination flex justify-center mt-8 mb-4 gap-2";
    paginationContainer.innerHTML = '';

    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&laquo; Anterior';
    prevButton.className = `px-4 py-2 rounded ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`;
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            updatePage(currentPage - 1);
        }
    });
    paginationContainer.appendChild(prevButton);

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        const firstPageButton = document.createElement('button');
        firstPageButton.textContent = '1';
        firstPageButton.className = 'px-4 py-2 rounded';
        firstPageButton.addEventListener('click', () => updatePage(1));
        paginationContainer.appendChild(firstPageButton);

        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'px-2 py-2';
            paginationContainer.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = `px-4 py-2 rounded ${i === currentPage ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'}`;
        pageButton.addEventListener('click', () => updatePage(i));
        paginationContainer.appendChild(pageButton);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'px-2 py-2';
            paginationContainer.appendChild(ellipsis);
        }

        const lastPageButton = document.createElement('button');
        lastPageButton.textContent = totalPages;
        lastPageButton.className = 'px-4 py-2 rounded';
        lastPageButton.addEventListener('click', () => updatePage(totalPages));
        paginationContainer.appendChild(lastPageButton);
    }

    const nextButton = document.createElement('button');
    nextButton.innerHTML = 'Próximo &raquo;';
    nextButton.className = `px-4 py-2 rounded ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`;
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            updatePage(currentPage + 1);
        }
    });
    paginationContainer.appendChild(nextButton);

    if (!document.getElementById("paginationContainer")) {
        document.querySelector('main').appendChild(paginationContainer);
    }
}

function updatePage(newPage) {
    currentPage = newPage;
    const url = new URL(window.location.href);

    if (currentSearchQuery) {
        url.searchParams.set('search', currentSearchQuery);
    } else {
        url.searchParams.set('category', currentCategory);
    }

    url.searchParams.set('page', newPage);
    window.history.pushState({}, '', url);
    displayProducts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initMobileMenu() {
    const menuButton = document.getElementById('menuButton');
    const closeMenuButton = document.getElementById('closeMenuButton');
    const menu = document.getElementById('menu');
    const produtosMenu = document.getElementById('produtosMenu');
    const produtosSubmenu = document.getElementById('produtosSubmenu');

    if (menuButton && menu) {
        menuButton.addEventListener('click', () => {
            menu.classList.toggle('open');
            menu.setAttribute('aria-hidden', !menu.classList.contains('open'));
        });
    }

    if (closeMenuButton && menu) {
        closeMenuButton.addEventListener('click', () => {
            menu.classList.remove('open');
            menu.setAttribute('aria-hidden', 'true');
        });
    }

    if (produtosMenu && produtosSubmenu) {
        produtosMenu.addEventListener('click', (e) => {
            e.preventDefault();
            produtosSubmenu.classList.toggle('open');
        });
    }
}

function initSearch() {
    const searchBox = document.getElementById('searchBox');
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');

    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `categorias.html?search=${encodeURIComponent(query)}`;
            }
        });
    }

    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            window.location.href = `categorias.html?category=${encodeURIComponent(currentCategory)}`;
        });
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    initMobileMenu();
    initSearch();

    const params = new URLSearchParams(window.location.search);
    currentCategory = params.get("category");
    currentSearchQuery = params.get("search") || "";
    currentPage = parseInt(params.get("page")) || 1;

    if (!currentCategory && !currentSearchQuery) {
        window.location.href = "index.html";
        return;
    }

    const categoryTitle = document.getElementById("categoryTitle");
    if (currentSearchQuery) {
        categoryTitle.textContent = `Resultados para "${currentSearchQuery}"`;
    } else {
        categoryTitle.textContent = currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1);
    }

    await displayProducts(currentPage);
});