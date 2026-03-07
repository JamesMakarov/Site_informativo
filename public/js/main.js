// public/js/main.js
// RESPONSABILIDADE: Interface, Navegação SPA, Dark Mode e Animações

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. LÓGICA DO MODO ESCURO ---
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

    // --- 2. MENU MOBILE E SCROLL DA NAVBAR ---
    const navbar = document.querySelector('header');
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');
    const contentArea = document.getElementById('app-content');
    const loader = document.getElementById('loader');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('shadow-md');
        else navbar.classList.remove('shadow-md');
    });

    if (mobileBtn && navMenu) {
        mobileBtn.addEventListener('click', () => {
            navMenu.classList.toggle('opacity-0');
            navMenu.classList.toggle('invisible');
            navMenu.classList.toggle('-translate-y-5');
        });
    }

    // --- 3. VIGIA DE ANIMAÇÕES (SCROLL REVEAL) ---
    window.iniciarAnimacoes = function() {
        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach((entrada) => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add('show-scroll');
                    observador.unobserve(entrada.target); 
                }
            });
        }, { threshold: 0.1 }); 
        document.querySelectorAll('.hidden-scroll').forEach((el) => observador.observe(el));
    };
    window.iniciarAnimacoes(); 

    // --- 4. SISTEMA DE TOASTS (Global) ---
    window.mostrarToast = function(mensagem, isError = false) {
        document.querySelectorAll('.toast').forEach(t => t.remove());
        const toast = document.createElement('div');
        toast.className = `toast ${isError ? 'toast-error' : ''}`;
        toast.innerText = mensagem;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    };

    // --- 5. NAVEGAÇÃO SPA (Single Page Application) ---
    window.recarregarPaginaSPA = async function() {
        if (loader) loader.classList.remove('hidden');
        try {
            const response = await fetch(window.location.href, { headers: { 'X-Requested-With': 'fetch' } });
            contentArea.innerHTML = await response.text();
            window.iniciarAnimacoes();
            if(window.inicializarCarrosseis) window.inicializarCarrosseis(); 
        } catch(e) {}
        if (loader) loader.classList.add('hidden');
    };

    document.body.addEventListener('click', async (e) => {
        // Ignorar cliques na área administrativa
        if (e.target && e.target.closest('.cms-editavel, button[class*="btn-editar"], button[class*="btn-remover"], button[class*="btn-adicionar"]')) return;

        // Fechar menu mobile ao clicar em link
        const navLinkClicado = e.target.closest('.nav-link');
        if (navLinkClicado && window.innerWidth < 768 && navMenu) { 
            navMenu.classList.add('opacity-0', 'invisible', '-translate-y-5');
        }

        // Intercetar navegação SPA
        const link = e.target.closest('a');
        if (link && (link.classList.contains('nav-link') || link.classList.contains('footer-link')) && link.href.startsWith(window.location.origin) && !link.hash) {
            e.preventDefault();
            const url = link.href;

            if (loader) loader.classList.remove('hidden');

            try {
                const response = await fetch(url, { headers: { 'X-Requested-With': 'fetch' } });
                contentArea.innerHTML = await response.text();
                window.history.pushState(null, '', url); 
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
                
                window.iniciarAnimacoes(); 
                if(window.inicializarCarrosseis) window.inicializarCarrosseis();
                
                setTimeout(() => { if(loader) loader.classList.add('hidden'); }, 300);
            } catch (error) { window.location.href = url; }
        }

        // Copiar PIX
        if (e.target && e.target.id === 'btn-copiar-pix') {
            const inputPix = document.getElementById('chave-pix');
            inputPix.select();
            navigator.clipboard.writeText(inputPix.value).then(() => {
                const btn = e.target;
                const txt = btn.innerText;
                btn.innerText = "COPIADO ✓";
                btn.classList.replace('bg-brand-primary', 'bg-green-600');
                window.mostrarToast("Chave PIX copiada com sucesso!");
                setTimeout(() => { btn.innerText = txt; btn.classList.replace('bg-green-600', 'bg-brand-primary'); }, 3000);
            });
        }
    });

    window.addEventListener('popstate', async () => {
        window.recarregarPaginaSPA();
    });

    // Envio do Formulário de Oração
    document.addEventListener('submit', async (e) => {
        if (e.target && e.target.id === 'form-oracao') {
            e.preventDefault();
            const form = e.target;
            const btnSubmit = form.querySelector('.btn-submit');
            const btnText = form.querySelector('.btn-text');
            const btnLoader = form.querySelector('.btn-loader');

            const dados = { nome: document.getElementById('nome').value, pedido: document.getElementById('pedido').value };

            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
            btnSubmit.disabled = true;

            try {
                const response = await fetch('/api/oracao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });
                const result = await response.json();
                if (result.sucesso) { window.mostrarToast(result.mensagem); form.reset(); }
            } catch (error) { window.mostrarToast("Erro ao conectar.", true); } 
            finally {
                btnText.classList.remove('hidden');
                btnLoader.classList.add('hidden');
                btnSubmit.disabled = false;
            }
        }
    });
});