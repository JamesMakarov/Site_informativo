document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. LÓGICA DO MODO ESCURO (DARK MODE) ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

    if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        if (themeToggleLightIcon) themeToggleLightIcon.classList.remove('hidden');
    } else {
        if (themeToggleDarkIcon) themeToggleDarkIcon.classList.remove('hidden');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function() {
            themeToggleDarkIcon.classList.toggle('hidden');
            themeToggleLightIcon.classList.toggle('hidden');

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
    }

    // --- ELEMENTOS PRINCIPAIS ---
    const navbar = document.querySelector('header');
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');
    const contentArea = document.getElementById('app-content');
    const loader = document.getElementById('loader');

    // --- 2. LÓGICA DA NAVBAR E MENU DE CELULAR (A CORREÇÃO AQUI) ---
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('shadow-md');
        else navbar.classList.remove('shadow-md');
    });

    if (mobileBtn && navMenu) {
        mobileBtn.addEventListener('click', () => {
            // Em vez de '.active', usamos as classes do Tailwind!
            navMenu.classList.toggle('hidden');
            navMenu.classList.toggle('flex');
        });
    }

    // Fecha o menu de celular sozinho quando você clica numa opção
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('.nav-link');
        // Se for ecrã de celular (< 768px) e clicar num link
        if (link && window.innerWidth < 768) { 
            if (navMenu && !navMenu.classList.contains('hidden')) {
                navMenu.classList.add('hidden');
                navMenu.classList.remove('flex');
            }
        }
    });

    // --- 3. VIGIA DE ANIMAÇÕES (SCROLL REVEAL) ---
    function iniciarAnimacoes() {
        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach((entrada) => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add('show-scroll');
                    observador.unobserve(entrada.target); 
                }
            });
        }, { threshold: 0.1 }); 

        const elementosEscondidos = document.querySelectorAll('.hidden-scroll');
        elementosEscondidos.forEach((el) => {
            observador.observe(el);
        });
    }

    iniciarAnimacoes(); 

    // --- 4. NAVEGAÇÃO FLUIDA SEM RECARREGAR (SPA) ---
    document.body.addEventListener('click', async (e) => {
        const link = e.target.closest('a');
        if (!link || !link.href.startsWith(window.location.origin) || link.hash) return;
        
        if (link.classList.contains('nav-link') || link.classList.contains('footer-link')) {
            e.preventDefault();
            const url = link.href;

            if (loader) loader.classList.remove('hidden');

            try {
                const response = await fetch(url, { headers: { 'X-Requested-With': 'fetch' } });
                const html = await response.text();
                
                contentArea.innerHTML = html;
                window.history.pushState(null, '', url); 
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
                
                iniciarAnimacoes(); // Avisa o vigilante para animar a página nova
                
                setTimeout(() => { if(loader) loader.classList.add('hidden'); }, 300);
            } catch (error) {
                console.error("Erro no carregamento", error);
                window.location.href = url; 
            }
        }
    });

    window.addEventListener('popstate', async () => {
        if (loader) loader.classList.remove('hidden');
        try {
            const response = await fetch(window.location.href, { headers: { 'X-Requested-With': 'fetch' } });
            contentArea.innerHTML = await response.text();
            iniciarAnimacoes();
        } catch(e) {}
        if (loader) loader.classList.add('hidden');
    });

    // --- 5. LÓGICA DE COPIAR PIX ---
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'btn-copiar-pix') {
            const inputPix = document.getElementById('chave-pix');
            inputPix.select();
            navigator.clipboard.writeText(inputPix.value).then(() => {
                const btn = e.target;
                const textoOriginal = btn.innerText;
                btn.innerText = "COPIADO ✓";
                btn.classList.add('bg-green-600'); 
                btn.classList.remove('bg-brand-primary');
                mostrarToast("Chave PIX copiada com sucesso!");
                setTimeout(() => {
                    btn.innerText = textoOriginal;
                    btn.classList.remove('bg-green-600');
                    btn.classList.add('bg-brand-primary');
                }, 3000);
            });
        }
    });

    // --- 6. ENVIO DO FORMULÁRIO DE ORAÇÃO ---
    document.addEventListener('submit', async (e) => {
        if (e.target && e.target.id === 'form-oracao') {
            e.preventDefault();
            const form = e.target;
            const btnSubmit = form.querySelector('.btn-submit');
            const btnText = form.querySelector('.btn-text');
            const btnLoader = form.querySelector('.btn-loader');

            const dados = {
                nome: document.getElementById('nome').value,
                pedido: document.getElementById('pedido').value
            };

            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
            btnSubmit.disabled = true;

            try {
                const response = await fetch('/api/oracao', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });
                const result = await response.json();
                if (result.sucesso) {
                    mostrarToast(result.mensagem);
                    form.reset();
                }
            } catch (error) {
                mostrarToast("Erro ao conectar com a congregação.", true);
            } finally {
                btnText.classList.remove('hidden');
                btnLoader.classList.add('hidden');
                btnSubmit.disabled = false;
            }
        }
    });

    // --- 7. SISTEMA DE TOASTS (AVISOS) ---
    function mostrarToast(mensagem, isError = false) {
        const toast = document.createElement('div');
        toast.className = `toast ${isError ? 'toast-error' : ''}`;
        toast.innerText = mensagem;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }
});