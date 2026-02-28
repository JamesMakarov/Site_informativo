document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DO MODO ESCURO (DARK MODE) ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

    // Altera o ícone com base na preferência atual
    if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        themeToggleLightIcon.classList.remove('hidden');
    } else {
        themeToggleDarkIcon.classList.remove('hidden');
    }

    themeToggleBtn.addEventListener('click', function() {
        // Alterna os ícones do botão
        themeToggleDarkIcon.classList.toggle('hidden');
        themeToggleLightIcon.classList.toggle('hidden');

        // Lógica de alternância do HTML e salvamento
        if (localStorage.getItem('color-theme')) {
            if (localStorage.getItem('color-theme') === 'light') {
                document.documentElement.classList.add('dark');
                localStorage.setItem('color-theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('color-theme', 'light');
            }
        } else {
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('color-theme', 'light');
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('color-theme', 'dark');
            }
        }
    });
    // --- FIM DA LÓGICA DO MODO ESCURO ---
    
    const navbar = document.querySelector('.navbar');
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');
    const contentArea = document.getElementById('app-content');
    const loader = document.getElementById('loader');

    // 1. Efeitos da Barra e Menu Mobile
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // 2. Animação Premium de Rolagem (Cascata)
    // 2. O Vigia do Scroll Reveal
    function iniciarAnimacoes() {
        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach((entrada) => {
                if (entrada.isIntersecting) {
                    // Quando o elemento entra na tela, adiciona a classe que traz ele de baixo
                    entrada.target.classList.add('show-scroll');
                    observador.unobserve(entrada.target); // Para de olhar pra não ficar repetindo
                }
            });
        }, { threshold: 0.1 }); // O elemento surge quando 10% dele aparece na tela

        // Pega TODO MUNDO que tem a classe hidden-scroll (em qualquer página)
        const elementosEscondidos = document.querySelectorAll('.hidden-scroll');
        elementosEscondidos.forEach((el) => {
            observador.observe(el);
        });
    }

    iniciarAnimacoes(); // Roda ao carregar a primeira vez

    // 3. NAVEGAÇÃO FLUIDA (SPA Real)
    // Ouve cliques no corpo inteiro e filtra se foi num link da navbar ou rodapé
    document.body.addEventListener('click', async (e) => {
        const link = e.target.closest('a');
        if (!link || !link.href.startsWith(window.location.origin) || link.hash) return;
        
        // Se for um link de navegação nosso
        if (link.classList.contains('nav-link') || link.classList.contains('footer-link')) {
            e.preventDefault();
            const url = link.href;

            if (navMenu.classList.contains('active')) navMenu.classList.remove('active');
            if (loader) loader.classList.remove('hidden');

            try {
                const response = await fetch(url, { headers: { 'X-Requested-With': 'fetch' } });
                const html = await response.text();
                
                contentArea.innerHTML = html;
                window.history.pushState(null, '', url); // MUDA A URL REAL DO SITE
                window.scrollTo({ top: 0, behavior: 'smooth' }); // Volta pro topo
                
                iniciarAnimacoes(); // Refaz as animações na página nova
                
                setTimeout(() => { if(loader) loader.classList.add('hidden'); }, 300);
            } catch (error) {
                console.error("Erro no carregamento", error);
                window.location.href = url; // Se o JS falhar, carrega do jeito tradicional
            }
        }
    });

    // Lida com o botão "Voltar" do navegador/celular
    window.addEventListener('popstate', async () => {
        if (loader) loader.classList.remove('hidden');
        const response = await fetch(window.location.href, { headers: { 'X-Requested-With': 'fetch' } });
        contentArea.innerHTML = await response.text();
        iniciarAnimacoes();
        if (loader) loader.classList.add('hidden');
    });

    // --- MANTÉM OS EVENTOS DO PIX E DO FORMULÁRIO AQUI ---
    // (Pode copiar aquelas funções de clicar no PIX e submeter o formulário que já tínhamos)
});