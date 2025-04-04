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
            <h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
            <div class="relative">
                <button class="category-nav-button category-prev" aria-label="Anterior">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <div class="carousel-container">
                    <div class="carousel-track" id="${carouselId}">
                        ${products.slice(0, 10).map(product => `
                            <div class="product-card">
                                <div class="relative">
                                    <img src="${product.images[0] || product.image}" 
                                         alt="${product.name}" 
                                         class="w-full h-48 object-cover"
                                         loading="lazy">
                                    ${product.readyToShip ?
                `<span class="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                            Pronta Entrega
                                        </span>` : ''}
                                    <button class="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black text-white p-2 rounded-full hover:bg-gray-800 transition" 
                                            data-id="${product.id}"
                                            aria-label="Comprar ${product.name}">
                                        <i class="fas fa-shopping-bag"></i>
                                    </button>
                                </div>
                                <div class="p-4">
                                    <h4 class="font-semibold truncate">${product.name}</h4>
                                    <p class="font-bold text-lg">${product.price}</p>
                                    <p class="text-sm text-gray-600">6x de R$${(parseFloat(product.price.replace('R$', '')) / 6).toFixed(2)}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <button class="category-nav-button category-next" aria-label="Próximo">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="text-center mt-2">
                <a href="categorias.html?category=${encodeURIComponent(category)}" class="text-blue-600 hover:underline">
                    Ver todos os ${category.toLowerCase()}
                </a>
            </div>
        `;

        container.appendChild(carouselSection);
        initCategoryCarousel(carouselId, carouselSection);
    }

    document.querySelectorAll('.product-card button[data-id]').forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.getAttribute('data-id');
            window.location.href = `produto.html?id=${productId}`;
        });
    });
}

function initCategoryCarousel(carouselId, container) {
    const track = container.querySelector(`#${carouselId}`);
    const prevBtn = container.querySelector('.category-prev');
    const nextBtn = container.querySelector('.category-next');

    let isDragging = false;
    let startX;
    let scrollLeft;

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
    });

    track.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.touches[0].pageX - track.offsetLeft;
        const walk = (x - startX) * 2;
        track.scrollLeft = scrollLeft - walk;
    });

    prevBtn.addEventListener('click', () => {
        track.scrollBy({
            left: -200,
            behavior: 'smooth'
        });
    });

    nextBtn.addEventListener('click', () => {
        track.scrollBy({
            left: 200,
            behavior: 'smooth'
        });
    });

    const checkNavButtons = () => {
        prevBtn.style.display = track.scrollLeft <= 0 ? 'none' : 'flex';
        nextBtn.style.display = track.scrollLeft >= track.scrollWidth - track.clientWidth ? 'none' : 'flex';
    };

    track.addEventListener('scroll', checkNavButtons);
    checkNavButtons();
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

    // Busca global - redireciona para categorias.html com o termo de busca
    document.getElementById("searchForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const query = document.getElementById("searchInput").value.trim();
        if (query) {
            window.location.href = `categorias.html?search=${encodeURIComponent(query)}`;
        }
    });
});