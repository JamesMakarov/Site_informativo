// public/js/carrossel.js
// RESPONSABILIDADE: Carrosséis Nativos (Scroll Livre) e Lightbox Fotográfico

window.inicializarCarrosseis = function() {
    
    // CSS dinâmico para esconder a barra de scroll (deixa o visual limpo)
    if (!document.getElementById('estilo-scroll-livre')) {
        const style = document.createElement('style');
        style.id = 'estilo-scroll-livre';
        style.innerHTML = `
            .scroll-livre::-webkit-scrollbar { display: none; }
            .scroll-livre { -ms-overflow-style: none; scrollbar-width: none; }
        `;
        document.head.appendChild(style);
    }

    function ativarCarrosselLivre(trackId, btnPrevId, btnNextId) {
        const track = document.getElementById(trackId);
        const btnPrev = document.getElementById(btnPrevId);
        const btnNext = document.getElementById(btnNextId);

        if (!track) return;

        // 1. Remove qualquer bloqueio ou transformação antiga
        track.style.transform = '';
        track.classList.remove('transition-transform', 'duration-700', 'ease-out', 'cursor-grab', 'active:cursor-grabbing');
        
        // 2. Aplica o Scroll Nativo Fluido
        track.classList.add('overflow-x-auto', 'snap-x', 'snap-mandatory', 'scroll-smooth', 'scroll-livre');

        // 3. Garante que os cartões "ancoram" perfeitamente (Snap)
        Array.from(track.children).forEach(card => {
            card.classList.add('snap-start', 'shrink-0');
        });

        // 4. Lógica das setas (faz o scroll calcular a largura do cartão e avançar suavemente)
        if (btnNext && btnPrev) {
            btnNext.onclick = () => {
                const card = track.children[0];
                if (!card) return;
                const largura = card.getBoundingClientRect().width;
                const gap = parseFloat(window.getComputedStyle(track).gap) || 0;
                track.scrollBy({ left: largura + gap, behavior: 'smooth' });
            };

            btnPrev.onclick = () => {
                const card = track.children[0];
                if (!card) return;
                const largura = card.getBoundingClientRect().width;
                const gap = parseFloat(window.getComputedStyle(track).gap) || 0;
                track.scrollBy({ left: -(largura + gap), behavior: 'smooth' });
            };
        }
    }

    // Ativa a magia nos 3 carrosséis do site
    ativarCarrosselLivre('carousel-track', 'btn-prev', 'btn-next');
    ativarCarrosselLivre('track-galeria-historia', 'btn-prev-galeria', 'btn-next-galeria');
    ativarCarrosselLivre('track-timeline', 'btn-prev-timeline', 'btn-next-timeline');
};

document.addEventListener('DOMContentLoaded', window.inicializarCarrosseis);


// ============================================================================
// SISTEMA DO LIGHTBOX (Galeria de Fotos)
// ============================================================================
document.body.addEventListener('click', (e) => {
    const galeriaItem = e.target.closest('.img-galeria');
    const btnEditInside = e.target.closest('.btn-editar-lista'); 
    
    if (galeriaItem && !btnEditInside) {
        const container = galeriaItem.closest('.columns-1, .grid, section, #track-galeria-historia'); 
        window.currentGalleryImgs = Array.from(container.querySelectorAll('.img-galeria img')).map(img => img.src);
        window.currentGalleryCaptions = Array.from(container.querySelectorAll('.img-galeria p')).map(p => p.innerText);
        window.currentImgIndex = window.currentGalleryImgs.indexOf(galeriaItem.querySelector('img').src);

        const lightbox = document.getElementById('lightbox-galeria');
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxCaption = document.getElementById('lightbox-caption');
        
        if (lightbox && lightboxImg) {
            lightboxImg.src = window.currentGalleryImgs[window.currentImgIndex];
            if(lightboxCaption) lightboxCaption.innerText = window.currentGalleryCaptions[window.currentImgIndex] || "";
            lightbox.classList.remove('hidden');
            lightbox.classList.add('flex');
        }
    }

    if (e.target.closest('#lightbox-prev')) {
        window.currentImgIndex = (window.currentImgIndex > 0) ? window.currentImgIndex - 1 : window.currentGalleryImgs.length - 1;
        document.getElementById('lightbox-img').src = window.currentGalleryImgs[window.currentImgIndex];
        const cap = document.getElementById('lightbox-caption');
        if(cap) cap.innerText = window.currentGalleryCaptions[window.currentImgIndex] || "";
    }

    if (e.target.closest('#lightbox-next')) {
        window.currentImgIndex = (window.currentImgIndex < window.currentGalleryImgs.length - 1) ? window.currentImgIndex + 1 : 0;
        document.getElementById('lightbox-img').src = window.currentGalleryImgs[window.currentImgIndex];
        const cap = document.getElementById('lightbox-caption');
        if(cap) cap.innerText = window.currentGalleryCaptions[window.currentImgIndex] || "";
    }

    if (e.target.id === 'fechar-lightbox' || e.target.id === 'lightbox-galeria') {
        document.getElementById('lightbox-galeria').classList.add('hidden');
        document.getElementById('lightbox-galeria').classList.remove('flex');
    }
});

document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox-galeria');
    if (lightbox && !lightbox.classList.contains('hidden')) {
        if (e.key === 'Escape') {
            lightbox.classList.add('hidden');
            lightbox.classList.remove('flex');
        } else if (e.key === 'ArrowLeft') {
            document.getElementById('lightbox-prev')?.click();
        } else if (e.key === 'ArrowRight') {
            document.getElementById('lightbox-next')?.click();
        }
    }
});