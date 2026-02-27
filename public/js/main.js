document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Lógica do Menu Mobile ---
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');
    const links = document.querySelectorAll('#nav-menu a');

    if (mobileBtn && navMenu) {
        mobileBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Fecha o menu do celular sozinho quando clica em um link âncora
    links.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
            }
        });
    });

    // --- 2. Animações de Scroll (Fazendo os blocos surgirem) ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show-scroll');
            }
        });
    }, { threshold: 0.1 });

    const elementos = document.querySelectorAll('.card-projeto, .card-noticia, .stat-card, .timeline-item, .hero-title, .form-container, .doacao-container');
    elementos.forEach((el) => {
        el.classList.add('hidden-scroll');
        observer.observe(el);
    });

    // --- 3. Lógica do Botão de Copiar PIX ---
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'btn-copiar-pix') {
            const inputPix = document.getElementById('chave-pix');
            inputPix.select();
            navigator.clipboard.writeText(inputPix.value).then(() => {
                const btn = e.target;
                const textoOriginal = btn.innerText;
                btn.innerText = "Copiado! ✓";
                btn.style.background = "linear-gradient(135deg, #059669 0%, #10B981 100%)";
                mostrarToast("Chave PIX copiada com sucesso!");
                setTimeout(() => {
                    btn.innerText = textoOriginal;
                    btn.style.background = "";
                }, 3000);
            });
        }
    });

    // --- 4. Formulário de Oração ---
    document.addEventListener('submit', async (e) => {
        if (e.target && e.target.id === 'form-oracao') {
            e.preventDefault();
            const form = e.target;
            const btnSubmit = form.querySelector('.btn-submit');
            const btnText = form.querySelector('.btn-text');
            const btnLoader = form.querySelector('.btn-loader');

            const formData = {
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
                    body: JSON.stringify(formData)
                });
                const result = await response.json();
                if (result.sucesso) {
                    mostrarToast(result.mensagem);
                    form.reset();
                }
            } catch (error) {
                mostrarToast("Erro ao conectar com o servidor.", true);
            } finally {
                btnText.classList.remove('hidden');
                btnLoader.classList.add('hidden');
                btnSubmit.disabled = false;
            }
        }
    });

    // Função Toast Visual
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