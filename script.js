import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.12.0/+esm";

const supabaseUrl = "https://akpmbgyrnoqvgegwnciz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrcG1iZ3lybm9xdmdlZ3duY2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NzE5NDAsImV4cCI6MjA1MDI0Nzk0MH0.mbN5DB16tfc_iQ6-chS2dUI7-0wc23KWQB-TcWib4t8";
const supabase = createClient(supabaseUrl, supabaseKey);

let allProducts = [];

async function fetchProducts() {
    try {
        const { data, error } = await supabase.from("produtos").select("*");

        if (error) {
            console.error("Erro ao buscar produtos:", error);
            return [];
        }

        allProducts = data.map((product) => ({
            id: product.id,
            name: product.nome,
            price: `R$${parseFloat(product.preco).toFixed(2)}`,
            rawPrice: parseFloat(product.preco), // Armazena o valor numérico para cálculos
            size: product.tamanho,
            image: product.imagem_url,
            images: product.imagens_url ? product.imagens_url.split(", ") : [],
            category: product.categoria,
            readyToShip: product.pronta_entrega || false
        }));

        return allProducts;
    } catch (err) {
        console.error("Erro inesperado:", err);
        return [];
    }
}

async function createCategoryCarousels() {
    const container = document.getElementById('categoryCarousels');
    container.innerHTML = '';

    const productsByCategory = {};
    allProducts.forEach(product => {
        if (!productsByCategory[product.category]) {
            productsByCategory[product.category] = [];
        }
        productsByCategory[product.category].push(product);
    });

    for (const [category, products] of Object.entries(productsByCategory)) {
        if (products.length === 0) continue;

        const carouselId = `carousel-${category.replace(/\s+/g, '-')}`;
        const carouselSection = document.createElement('section');
        carouselSection.className = 'category-carousel mb-12';
        carouselSection.innerHTML = `
            <h3 class="text-xl font-bold mb-4">${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
            <div class="relative">
                <button class="category-nav-button category-prev" aria-label="Anterior">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <div class="carousel-container">
                    <div class="carousel-track" id="${carouselId}">
                        ${products.slice(0, 10).map(product => {
            // Cálculo correto: (valor + 8%) dividido por 6 parcelas
            const valorComAcrescimo = product.rawPrice * 1.08;
            const valorParcela = (valorComAcrescimo / 6).toFixed(2);

            return `
                                <div class="product-card" data-id="${product.id}">
                                    <div class="product-card-image">
                                        ${product.readyToShip ? '<span class="ready-to-ship">Pronta Entrega</span>' : ''}
                                        <img src="${product.images[0] || product.image}" alt="${product.name}" loading="lazy">
                                    </div>
                                    <div class="product-card-content">
                                        <h4>${product.name}</h4>
                                        <p class="price">${product.price}</p>
                                        <p class="installments">6x de R$${valorParcela}</p>
                                    </div>
                                </div>
                            `;
        }).join('')}
                    </div>
                </div>
                <button class="category-nav-button category-next" aria-label="Próximo">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <a href="categorias.html?category=${encodeURIComponent(category)}" class="view-all">
                Ver Mais
            </a>
        `;

        container.appendChild(carouselSection);
        initCategoryCarousel(carouselId, carouselSection);
    }

    // Adiciona evento de clique para todos os cards de produto
    document.addEventListener('click', function(e) {
        const productCard = e.target.closest('.product-card');
        if (productCard) {
            const productId = productCard.getAttribute('data-id');
            window.location.href = `produto.html?id=${productId}`;
        }
    });
}

function initCategoryCarousel(carouselId, container) {
    const track = container.querySelector(`#${carouselId}`);
    const prevBtn = container.querySelector('.category-prev');
    const nextBtn = container.querySelector('.category-next');
    const products = container.querySelectorAll('.product-card');
    const productWidth = products[0].offsetWidth + 16;

    let currentPosition = 0;
    let isDragging = false;
    let startX;
    let scrollLeft;

    function getVisibleProductsCount() {
        if (window.innerWidth < 640) return 2;
        if (window.innerWidth < 768) return 3;
        if (window.innerWidth < 1024) return 4;
        return 5;
    }

    nextBtn.addEventListener('click', () => {
        const productsToScroll = getVisibleProductsCount();
        currentPosition = Math.min(
            currentPosition + productsToScroll * productWidth,
            track.scrollWidth - track.offsetWidth
        );
        track.scrollTo({ left: currentPosition, behavior: 'smooth' });
    });

    prevBtn.addEventListener('click', () => {
        const productsToScroll = getVisibleProductsCount();
        currentPosition = Math.max(
            currentPosition - productsToScroll * productWidth,
            0
        );
        track.scrollTo({ left: currentPosition, behavior: 'smooth' });
    });

    track.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.pageX - track.offsetLeft;
        scrollLeft = track.scrollLeft;
        track.style.cursor = 'grabbing';
        track.style.scrollBehavior = 'auto';
    });

    track.addEventListener('mouseleave', () => {
        isDragging = false;
        track.style.cursor = 'grab';
    });

    track.addEventListener('mouseup', () => {
        isDragging = false;
        track.style.cursor = 'grab';
        track.style.scrollBehavior = 'smooth';
        currentPosition = track.scrollLeft;
    });

    track.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - track.offsetLeft;
        const walk = (x - startX) * 2;
        track.scrollLeft = scrollLeft - walk;
    });

    track.addEventListener('touchstart', (e) => {
        isDragging = true;
        startX = e.touches[0].pageX - track.offsetLeft;
        scrollLeft = track.scrollLeft;
        track.style.scrollBehavior = 'auto';
    });

    track.addEventListener('touchend', () => {
        isDragging = false;
        track.style.scrollBehavior = 'smooth';
        currentPosition = track.scrollLeft;
    });

    track.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.touches[0].pageX - track.offsetLeft;
        const walk = (x - startX) * 2;
        track.scrollLeft = scrollLeft - walk;
    });

    track.addEventListener('scroll', () => {
        currentPosition = track.scrollLeft;
    });
}

function initMainCarousel() {
    let currentIndex = 0;
    const carouselTrack = document.querySelector(".carousel-track");
    const slides = document.querySelectorAll(".carousel-track > div");
    const totalSlides = slides.length;

    function updateCarousel() {
        const offset = -currentIndex * 100;
        carouselTrack.style.transform = `translateX(${offset}%)`;
    }

    function nextSlide() {
        if (currentIndex < totalSlides - 1) {
            currentIndex++;
        } else {
            currentIndex = 0;
        }
        updateCarousel();
    }

    document.querySelector(".carousel-prev").addEventListener("click", () => {
        if (currentIndex > 0) {
            currentIndex--;
        } else {
            currentIndex = totalSlides - 1;
        }
        updateCarousel();
    });

    document.querySelector(".carousel-next").addEventListener("click", () => {
        nextSlide();
    });

    updateCarousel();
    setInterval(nextSlide, 8000);
}

document.addEventListener("DOMContentLoaded", async () => {
    initMainCarousel();
    await fetchProducts();
    createCategoryCarousels();

    document.getElementById("searchForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const query = document.getElementById("searchInput").value.trim();
        if (query) {
            window.location.href = `categorias.html?search=${encodeURIComponent(query)}`;
        }
    });
});