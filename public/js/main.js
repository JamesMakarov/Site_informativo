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

    // --- 2. LÓGICA DA NAVBAR E MENU DE CELULAR ---
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

    // --- 4. MOTOR DO CARROSSEL DE DEPOIMENTOS ---
    function inicializarCarrossel() {
        const track = document.getElementById('carousel-track');
        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');

        if (track && btnPrev && btnNext) {
            let indexAtual = 0;
            const atualizarCarrossel = () => {
                if(!track.children[0]) return;
                const larguraCartao = track.children[0].getBoundingClientRect().width;
                const gap = 32; 
                track.style.transform = `translateX(-${indexAtual * (larguraCartao + gap)}px)`;
            };

            btnNext.onclick = () => {
                const visibleCards = window.innerWidth < 768 ? 1 : 3;
                const maxIndex = Math.max(0, track.children.length - visibleCards);
                if (indexAtual < maxIndex) { indexAtual++; atualizarCarrossel(); } 
                else { indexAtual = 0; atualizarCarrossel(); }
            };

            btnPrev.onclick = () => {
                if (indexAtual > 0) { indexAtual--; atualizarCarrossel(); }
            };

            window.addEventListener('resize', atualizarCarrossel);
        }
    }
    inicializarCarrossel();

    // --- 5. SISTEMA DE TOASTS (AVISOS) E SPA ---
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

    async function recarregarPaginaSPA() {
        if (loader) loader.classList.remove('hidden');
        try {
            const response = await fetch(window.location.href, { headers: { 'X-Requested-With': 'fetch' } });
            contentArea.innerHTML = await response.text();
            iniciarAnimacoes();
            inicializarCarrossel(); 
        } catch(e) {}
        if (loader) loader.classList.add('hidden');
    }

    // ========================================================================
    // --- 6. A GRANDE CENTRAL DE CLIQUES DO SITE (SPA + CMS + PIX + LISTAS)
    // ========================================================================
    document.body.addEventListener('click', async (e) => {
        
        // FECHAR MENU NO CELULAR AO CLICAR EM LINK
        const navLinkClicado = e.target.closest('.nav-link');
        if (navLinkClicado && window.innerWidth < 768) { 
            if (navMenu && !navMenu.classList.contains('opacity-0')) {
                navMenu.classList.add('opacity-0', 'invisible', '-translate-y-5');
            }
        }

        // NAVEGAÇÃO SPA (Sem recarregar a página inteira)
        const link = e.target.closest('a');
        if (link && (link.classList.contains('nav-link') || link.classList.contains('footer-link')) && link.href.startsWith(window.location.origin) && !link.hash) {
            e.preventDefault();
            const url = link.href;

            if (loader) loader.classList.remove('hidden');

            try {
                const response = await fetch(url, { headers: { 'X-Requested-With': 'fetch' } });
                const html = await response.text();
                
                contentArea.innerHTML = html;
                window.history.pushState(null, '', url); 
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
                
                iniciarAnimacoes(); 
                inicializarCarrossel();
                
                setTimeout(() => { if(loader) loader.classList.add('hidden'); }, 300);
            } catch (error) {
                window.location.href = url; 
            }
            return; 
        }

        // COPIAR PIX
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
            return;
        }

        // ==========================================================
        // --- SISTEMA CMS DO ADMINISTRADOR ---
        // ==========================================================

        // 0. UPLOADER UNIVERSAL DE IMAGENS (Abre a pasta do PC!)
        const btnUploadImagem = e.target.closest('[data-tipo="imagem"]');
        if (btnUploadImagem) {
            const pagina = btnUploadImagem.getAttribute('data-pagina');
            const chave = btnUploadImagem.getAttribute('data-chave');
            const lista = btnUploadImagem.getAttribute('data-lista');
            const index = btnUploadImagem.getAttribute('data-index');
            const campo = btnUploadImagem.getAttribute('data-campo');

            const inputUpload = document.createElement('input');
            inputUpload.type = 'file';
            inputUpload.accept = 'image/*';
            
            inputUpload.onchange = async (event) => {
                const file = event.target.files[0];
                if(!file) return;

                const formData = new FormData();
                
                // A REGRA DE OURO: Os textos vão primeiro para o servidor ler!
                formData.append('pagina', pagina);
                if (chave) formData.append('chave', chave);
                if (lista) {
                    formData.append('lista', lista);
                    formData.append('index', index);
                    formData.append('campo', campo);
                }
                
                // A imagem TEM de ser a última coisa a entrar no pacote
                formData.append('imagem', file);

                mostrarToast("A enviar imagem... ⏳");
                try {
                    const response = await fetch('/api/upload', { method: 'POST', body: formData });
                    const result = await response.json();
                    
                    if (result.sucesso) {
                        // Troca a imagem na tela na hora
                        let elId = chave ? `bg-${pagina}-${chave}` : `img-${lista}-${index}`;
                        let el = document.getElementById(elId) || document.getElementById(`img-${pagina}-${chave}`);

                        if (el) {
                            if (el.tagName === 'IMG') el.src = result.url;
                            else el.style.backgroundImage = `url('${result.url}')`;
                        }
                        mostrarToast("Imagem guardada e substituída! ✅");
                    } else {
                        mostrarToast("Falha ao salvar no banco.", true);
                    }
                } catch (error) {
                    mostrarToast("Erro ao enviar imagem.", true);
                }
            };
            inputUpload.click();
            return; 
        }

        // 1. Textos Simples (Títulos, Parágrafos)
        const btnEditCms = e.target.closest('.btn-editar-cms:not([data-tipo="imagem"])');
        if (btnEditCms) {
            const pagina = btnEditCms.getAttribute('data-pagina');
            const chave = btnEditCms.getAttribute('data-chave');
            const elTexto = document.getElementById(`texto-${pagina}-${chave}`);
            const novoTexto = prompt(`Editar ${chave}:`, elTexto.innerText);

            if (novoTexto && novoTexto.trim() !== "" && novoTexto !== elTexto.innerText) {
                const textoAntigo = elTexto.innerText;
                elTexto.innerText = novoTexto;
                try {
                    const response = await fetch('/api/salvar-edicao', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pagina, chave, novoTexto })
                    });
                    const result = await response.json();
                    if (result.sucesso) mostrarToast("Salvo com sucesso!");
                    else elTexto.innerText = textoAntigo;
                } catch (error) {
                    mostrarToast("Erro de conexão.", true);
                    elTexto.innerText = textoAntigo;
                }
            }
            return;
        }

        // 2. Depoimentos (Editar, Remover, Adicionar)
        const btnEditDep = e.target.closest('.btn-editar-depoimento');
        if (btnEditDep) {
            const index = btnEditDep.getAttribute('data-index');
            const campo = btnEditDep.getAttribute('data-campo');
            const elTexto = document.getElementById(`texto-dep-${index}-${campo}`);
            const novoTexto = prompt(`Editar ${campo}:`, elTexto.innerText);

            if (novoTexto && novoTexto.trim() !== "" && novoTexto !== elTexto.innerText) {
                elTexto.innerText = novoTexto;
                await fetch('/api/depoimento/editar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ index, campo, novoTexto }) });
                mostrarToast("Depoimento atualizado!");
            }
            return;
        }

        const btnRemoveDep = e.target.closest('.btn-remover-depoimento');
        if (btnRemoveDep) {
            if (confirm("Tem certeza que deseja apagar este depoimento?")) {
                const index = btnRemoveDep.getAttribute('data-index');
                await fetch('/api/depoimento/remover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ index }) });
                mostrarToast("Depoimento removido!");
                recarregarPaginaSPA(); 
            }
            return;
        }

        const btnAddDep = e.target.closest('#btn-adicionar-depoimento');
        if (btnAddDep) {
            await fetch('/api/depoimento/adicionar', { method: 'POST' });
            mostrarToast("Novo cartão adicionado! Edite os textos.");
            recarregarPaginaSPA(); 
            return;
        }

        // 3. FAQ (Editar, Remover, Adicionar)
        const btnEditFaq = e.target.closest('.btn-editar-faq');
        if (btnEditFaq) {
            const index = btnEditFaq.getAttribute('data-index');
            const campo = btnEditFaq.getAttribute('data-campo');
            const elTexto = document.getElementById(`texto-faq-${index}-${campo}`);
            const novoTexto = prompt(`Editar ${campo}:`, elTexto.innerText);

            if (novoTexto && novoTexto.trim() !== "" && novoTexto !== elTexto.innerText) {
                elTexto.innerText = novoTexto;
                await fetch('/api/faq/editar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ index, campo, novoTexto }) });
                mostrarToast("FAQ atualizada!");
            }
            return;
        }

        const btnRemoveFaq = e.target.closest('.btn-remover-faq');
        if (btnRemoveFaq) {
            if (confirm("Tem certeza que deseja apagar esta pergunta?")) {
                const index = btnRemoveFaq.getAttribute('data-index');
                await fetch('/api/faq/remover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ index }) });
                mostrarToast("Pergunta removida!");
                recarregarPaginaSPA(); 
            }
            return;
        }

        const btnAddFaq = e.target.closest('#btn-adicionar-faq');
        if (btnAddFaq) {
            await fetch('/api/faq/adicionar', { method: 'POST' });
            mostrarToast("Nova pergunta adicionada!");
            recarregarPaginaSPA(); 
            return;
        }

        // 4. Editar itens de Listas Genéricas
        const btnEditLista = e.target.closest('.btn-editar-lista:not([data-tipo="imagem"])');
        if (btnEditLista) {
            const pagina = btnEditLista.getAttribute('data-pagina');
            const lista = btnEditLista.getAttribute('data-lista');
            const index = btnEditLista.getAttribute('data-index');
            const campo = btnEditLista.getAttribute('data-campo');
            
            let elTexto = document.getElementById(`texto-${lista}-${index}-${campo}`);
            let isImagem = false;
            
            if (!elTexto) {
                elTexto = document.getElementById(`img-${lista}-${index}`);
                if (elTexto && elTexto.tagName === 'IMG') isImagem = true;
            }

            // Fallback de imagem caso não tenha o atributo data-tipo="imagem"
            if (isImagem) {
                const inputUpload = document.createElement('input');
                inputUpload.type = 'file';
                inputUpload.accept = 'image/*';
                
                inputUpload.onchange = async (event) => {
                    const file = event.target.files[0];
                    if(!file) return;

                    const formData = new FormData();
                    formData.append('imagem', file);
                    formData.append('pagina', pagina);
                    formData.append('lista', lista);
                    formData.append('index', index);
                    formData.append('campo', campo);

                    mostrarToast("A enviar imagem... ⏳");
                    try {
                        const response = await fetch('/api/upload', { method: 'POST', body: formData });
                        const result = await response.json();
                        if (result.sucesso) {
                            elTexto.src = result.url;
                            mostrarToast("Imagem atualizada! ✅");
                        }
                    } catch (e) { mostrarToast("Erro de rede.", true); }
                };
                inputUpload.click();
                return;
            }

            const textoAtual = elTexto.innerText;
            const novoTexto = prompt(`Editar ${campo}:`, textoAtual);

            if (novoTexto && novoTexto.trim() !== "" && novoTexto !== textoAtual) {
                elTexto.innerText = novoTexto;
                await fetch('/api/lista/editar', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ pagina, lista, index, campo, novoTexto }) 
                });
                mostrarToast("Atualizado com sucesso!");
            }
            return;
        }

        // 5. Adicionar em Listas Genéricas (História, Galeria, etc)
        const btnAddLista = e.target.closest('.btn-adicionar-lista');
        if (btnAddLista) {
            const pagina = btnAddLista.getAttribute('data-pagina');
            const lista = btnAddLista.getAttribute('data-lista');
            
            let novoItem = {};
            if (lista === 'capitulos') novoItem = { badge: "NOVO", titulo: "Novo Capítulo", p1: "Texto base...", p2: "", citacao: "", citacaoAutor: "", imagem: "https://via.placeholder.com/800x1000?text=Nova+Imagem" };
            if (lista === 'timeline') novoItem = { ano: "Ano", titulo: "Novo Marco", texto: "Descrição...", cor: "brand-primary" };
            if (lista === 'galeria') novoItem = { imagem: "https://via.placeholder.com/600x600?text=Nova+Foto", titulo: "Nova Memória" };

            await fetch('/api/lista/adicionar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pagina, lista, novoItem }) });
            mostrarToast("Item adicionado com sucesso!");
            recarregarPaginaSPA();
            return;
        }

        // 6. Remover de Listas Genéricas
        const btnRemoveLista = e.target.closest('.btn-remover-lista');
        if (btnRemoveLista) {
            if (confirm("Tem a certeza que deseja apagar isto permanentemente?")) {
                const pagina = btnRemoveLista.getAttribute('data-pagina');
                const lista = btnRemoveLista.getAttribute('data-lista');
                const index = btnRemoveLista.getAttribute('data-index');
                await fetch('/api/lista/remover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pagina, lista, index }) });
                mostrarToast("Apagado com sucesso!");
                recarregarPaginaSPA();
            }
            return;
        }

        // 7. LIGHTBOX DA GALERIA (Ampliar Imagem)
        const galeriaItem = e.target.closest('.img-galeria');
        const btnEditInside = e.target.closest('.btn-editar-lista'); 
        if (galeriaItem && !btnEditInside) {
            const src = galeriaItem.querySelector('img').src;
            const lightbox = document.getElementById('lightbox-galeria');
            const lightboxImg = document.getElementById('lightbox-img');
            if (lightbox && lightboxImg) {
                lightboxImg.src = src;
                lightbox.classList.remove('hidden');
                lightbox.classList.add('flex');
            }
            return;
        }

        // Fechar Lightbox
        if (e.target.id === 'fechar-lightbox' || e.target.id === 'lightbox-galeria') {
            document.getElementById('lightbox-galeria').classList.add('hidden');
            document.getElementById('lightbox-galeria').classList.remove('flex');
            return;
        }

    }); // <--- O FECHO CORRETO DE TODO O EVENTO DE CLIQUE!

    // ========================================================================
    // --- 7. BOTÃO VOLTAR DO NAVEGADOR ---
    // ========================================================================
    window.addEventListener('popstate', async () => {
        if (loader) loader.classList.remove('hidden');
        try {
            const response = await fetch(window.location.href, { headers: { 'X-Requested-With': 'fetch' } });
            contentArea.innerHTML = await response.text();
            iniciarAnimacoes();
            inicializarCarrossel();
        } catch(e) {}
        if (loader) loader.classList.add('hidden');
    });

    // ========================================================================
    // --- 8. ENVIO DO FORMULÁRIO DE ORAÇÃO ---
    // ========================================================================
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

});