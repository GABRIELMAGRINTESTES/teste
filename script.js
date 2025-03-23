import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.12.0/+esm";

// Configuração do Supabase
const supabaseUrl = "https://akpmbgyrnoqvgegwnciz.supabase.co";
const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrcG1iZ3lybm9xdmdlZ3duY2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NzE5NDAsImV4cCI6MjA1MDI0Nzk0MH0.mbN5DB16tfc_iQ6-chS2dUI7-0wc23KWQB-TcWib4t8";
const supabase = createClient(
    "https://akpmbgyrnoqvgegwnciz.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrcG1iZ3lybm9xdmdlZ3duY2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NzE5NDAsImV4cCI6MjA1MDI0Nzk0MH0.mbN5DB16tfc_iQ6-chS2dUI7-0wc23KWQB-TcWib4t8",
);

// Variáveis globais
let allProducts = []; // Armazenar todos os produtos
let currentCategory = "camisas";

// Função para buscar produtos do Supabase
async function fetchProducts() {
    const { data, error } = await supabase.from("produtos").select("*");
    if (error) {
        console.error("Erro ao buscar produtos:", error);
        return [];
    }
    allProducts = data.map((product) => ({
        id: product.id,
        name: product.nome,
        price: `R$${parseFloat(product.preco).toFixed(2)}`,
        size: product.tamanho,
        image: product.imagem_url,
        images: product.imagens_url ? product.imagens_url.split(", ") : [],
        category: product.categoria,
    }));
}

// Função para carregar produtos por categoria
async function loadProductsByCategory(category) {
    currentCategory = category;
    const filteredProducts = allProducts
        .filter((product) => product.category === category)
        .sort((a, b) => a.name.localeCompare(b.name)); // Ordena por ordem alfabética

    // Atualiza o título da categoria
    document.getElementById("categoryTitle").textContent =
        category.charAt(0).toUpperCase() + category.slice(1);
    displayProducts(filteredProducts);
}

// Função para exibir produtos na grade
function displayProducts(products) {
    const grid = document.getElementById("productGrid");
    const message = document.getElementById("searchMessage");
    grid.innerHTML = "";

    if (products.length === 0) {
        message.textContent =
            "Não encontrou o que procurava? Contate-nos no Instagram! @Magrin_Store";
        return;
    } else {
        message.textContent = "";
    }

    products.forEach((product) => {
        const productItem = `
            <div class="border rounded-lg overflow-hidden">
                <div class="relative">
                    <img src="${product.images.length > 0 ? product.images[0] : product.image}" 
                        alt="Imagem de ${product.name}" 
                        class="w-full">
                    <button class="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black text-white p-2 rounded-full" data-id="${product.id}">
                        <i class="fas fa-shopping-bag"></i>
                    </button>
                </div>
                <div class="p-4 text-center">
                    <h2 class="text-lg font-semibold">${product.name}</h2>
                    <p class="text-xl font-bold">${product.price}</p>
                    <p class="text-sm text-gray-500">6 x de <span class="text-blue-600">R$${(parseFloat(product.price.replace("R$", "")) / 6).toFixed(2)}</span> sem juros</p>
                </div>
            </div>
        `;
        grid.innerHTML += productItem;
    });

    // Adiciona evento de clique aos botões de compra
    document.querySelectorAll("button[data-id]").forEach((button) => {
        button.addEventListener("click", () => {
            const productId = button.getAttribute("data-id");
            window.location.href = `produto.html?id=${productId}`;
        });
    });
}

// Função para buscar itens na barra de pesquisa
function searchItems(event) {
    event.preventDefault();
    const query = document.getElementById("searchInput").value.toLowerCase();
    const filteredProducts = allProducts.filter(
        (product) => product.name.toLowerCase().includes(query), // Busca pelo nome do produto
    );
    displayProducts(filteredProducts);
}

// Adicionar evento de busca ao campo de pesquisa
document.getElementById("searchInput").addEventListener("input", searchItems);

// Carregar produtos da categoria "camisas" ao iniciar a página
document.addEventListener("DOMContentLoaded", async () => {
    await fetchProducts(); // Carrega os produtos
    loadProductsByCategory("camisas"); // Carrega a categoria "camisas" por padrão
});

// Expor funções para o escopo global
window.loadProductsByCategory = loadProductsByCategory;
window.searchItems = searchItems;
