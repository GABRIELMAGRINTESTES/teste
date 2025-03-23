import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.12.0/+esm";

// Configuração do Supabase
const supabaseUrl = "https://akpmbgyrnoqvgegwnciz.supabase.co";
const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrcG1iZ3lybm9xdmdlZ3duY2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NzE5NDAsImV4cCI6MjA1MDI0Nzk0MH0.mbN5DB16tfc_iQ6-chS2dUI7-0wc23KWQB-TcWib4t8";
const supabase = createClient(supabaseUrl, supabaseKey);

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

// Função para carregar os detalhes do produto
async function loadProductDetails() {
    // Obtém o ID do produto da URL
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    if (!productId) {
        console.error("ID do produto não encontrado na URL.");
        return;
    }

    console.log("ID do produto:", productId); // Debug

    // Busca os detalhes do produto no Supabase
    const { data: product, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("id", productId)
        .single();

    if (error) {
        console.error("Erro ao buscar produto:", error);
        return;
    }

    console.log("Produto encontrado:", product); // Debug

    // Exibe as informações do produto
    document.getElementById("productName").textContent = product.nome;
    document.getElementById("productPrice").textContent =
        `R$${parseFloat(product.preco).toFixed(2)}`;
    document.getElementById("productSize").textContent =
        `Tamanho: ${product.tamanho}`;
    document.getElementById("productInstallments").textContent =
        `6x de R$${(parseFloat(product.preco) / 6).toFixed(2)} sem juros`;

    // Exibe as imagens do produto no carrossel
    const carouselTrack = document.getElementById("productCarousel");
    const images = product.imagens_url
        ? product.imagens_url.split(",").map((url) => url.trim()) // Divide as URLs e remove espaços
        : [product.imagem_url]; // Fallback para uma única imagem

    // Limpa o carrossel antes de adicionar novas imagens
    carouselTrack.innerHTML = "";

    // Adiciona as imagens ao carrossel
    images.forEach((image) => {
        const slide = document.createElement("div");
        slide.className = "w-full";
        slide.innerHTML = `<img src="${image}" alt="${product.nome}" class="w-full" />`;
        carouselTrack.appendChild(slide);
    });

    // Reinicializa o carrossel após adicionar as imagens
    initializeCarousel();
}

// Função para inicializar o carrossel
function initializeCarousel() {
    const carouselTrack = document.querySelector(".carousel-track");
    const slides = document.querySelectorAll(".carousel-track > div");
    const totalSlides = slides.length;
    let currentIndex = 0;

    // Função para atualizar a posição do carrossel
    function updateCarousel() {
        const offset = -currentIndex * 100; // Calcula o deslocamento
        carouselTrack.style.transform = `translateX(${offset}%)`;
    }

    // Função para avançar para o próximo slide
    function nextSlide() {
        if (currentIndex < totalSlides - 1) {
            currentIndex++;
        } else {
            currentIndex = 0; // Volta para o primeiro slide
        }
        updateCarousel();
    }

    // Evento para o botão "Anterior"
    document.querySelector(".carousel-prev").addEventListener("click", () => {
        if (currentIndex > 0) {
            currentIndex--;
        } else {
            currentIndex = totalSlides - 1; // Volta para o último slide
        }
        updateCarousel();
    });

    // Evento para o botão "Próximo"
    document.querySelector(".carousel-next").addEventListener("click", () => {
        nextSlide();
    });

    // Inicializa o carrossel
    updateCarousel();

    // Autoplay: Passa para o próximo slide a cada 12 segundos
    setInterval(nextSlide, 12000); // 12000ms = 12s
}

// Carregar produtos da categoria "camisas" ao iniciar a página
document.addEventListener("DOMContentLoaded", async () => {
    await fetchProducts(); // Carrega os produtos
    loadProductsByCategory("camisas"); // Carrega a categoria "camisas" por padrão
});

// Carrega os detalhes do produto ao carregar a página produto.html
if (window.location.pathname.includes("produto.html")) {
    document.addEventListener("DOMContentLoaded", loadProductDetails);
}

// Expor funções para o escopo global
window.loadProductsByCategory = loadProductsByCategory;
window.searchItems = searchItems;
