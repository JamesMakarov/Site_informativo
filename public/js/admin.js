// public/js/admin.js
// RESPONSABILIDADE: Funções Exclusivas do CMS (Uploads, Fetch para salvar dados, Criação de Notícias)

document.addEventListener('DOMContentLoaded', () => {

    // Edição Inline de Textos (Salva ao perder o foco da caixa de texto)
    document.body.addEventListener('focusout', async (e) => {
        if (e.target && e.target.classList.contains('cms-editavel')) {
            const el = e.target;
            const pagina = el.getAttribute('data-pagina');
            const lista = el.getAttribute('data-lista');
            const index = el.getAttribute('data-index');
            const campo = el.getAttribute('data-campo');
            const chave = el.getAttribute('data-chave');

            const novoTexto = (campo === 'conteudoCompleto') ? el.innerHTML : el.innerText.trim();

            try {
                let url = '/api/salvar-edicao';
                let bodyData = { pagina, chave, novoTexto };

                if (lista) {
                    url = '/api/lista/editar';
                    bodyData = { pagina, lista, index, campo, novoTexto };
                }

                const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyData) });
                if (response.ok) window.mostrarToast("Salvo! ✅");
            } catch (err) {
                window.mostrarToast("Erro ao salvar a edição.", true);
            }
        }
    });

    document.body.addEventListener('click', async (e) => {

        // 1. UPLOADER DE IMAGENS UNIVERSAL
        const btnUploadImagem = e.target.closest('[data-tipo="imagem"], [data-campo="imagem"]');
        if (btnUploadImagem && !e.target.closest('.btn-adicionar-foto-direto')) {
            const pagina = btnUploadImagem.getAttribute('data-pagina');
            const chave = btnUploadImagem.getAttribute('data-chave');
            const lista = btnUploadImagem.getAttribute('data-lista');
            const index = btnUploadImagem.getAttribute('data-index');
            const campo = btnUploadImagem.getAttribute('data-campo') || 'imagem';

            const inputUpload = document.createElement('input');
            inputUpload.type = 'file';
            inputUpload.accept = 'image/*';
            
            inputUpload.onchange = async (event) => {
                const file = event.target.files[0];
                if(!file) return;

                const formData = new FormData();
                formData.append('pagina', pagina);
                if (chave) formData.append('chave', chave);
                if (lista) { formData.append('lista', lista); formData.append('index', index); formData.append('campo', campo); }
                formData.append('imagem', file);

                window.mostrarToast("A enviar imagem... ⏳");

                try {
                    const response = await fetch('/api/upload', { method: 'POST', body: formData });
                    const result = await response.json();
                    
                    if (result.sucesso) {
                        let el = document.getElementById(`img-${lista}-${index}-${campo}`) 
                              || document.getElementById(`img-${lista}-${index}`)
                              || document.getElementById(`bg-${pagina}-${chave}`) 
                              || document.getElementById(`img-${pagina}-${chave}`);

                        if (el) {
                            if (el.tagName === 'IMG') el.src = result.url;
                            else el.style.backgroundImage = `url('${result.url}')`;
                            if(el.parentElement) el.parentElement.classList.remove('hidden');
                        }
                        window.mostrarToast("Imagem guardada! ✅");
                        if (campo === 'fotoAutor') window.recarregarPaginaSPA();
                    }
                } catch (error) { window.mostrarToast("Erro ao enviar imagem.", true); }
            };
            inputUpload.click();
            return; 
        }

        // 2. UPLOAD DIRETO NA GALERIA (Pede foto logo na criação)
        const btnAddFotoDireto = e.target.closest('.btn-adicionar-foto-direto');
        if (btnAddFotoDireto) {
            const pagina = btnAddFotoDireto.getAttribute('data-pagina');
            const lista = btnAddFotoDireto.getAttribute('data-lista');

            const inputUpload = document.createElement('input');
            inputUpload.type = 'file';
            inputUpload.accept = 'image/*';
            
            inputUpload.onchange = async (event) => {
                const file = event.target.files[0];
                if(!file) return;

                const formData = new FormData();
                formData.append('imagem', file); 

                window.mostrarToast("A carregar nova fotografia... ⏳");
                try {
                    const response = await fetch('/api/upload', { method: 'POST', body: formData });
                    const result = await response.json();
                    
                    if (result.sucesso) {
                        const novoItem = { imagem: result.url, titulo: "Nova Memória Fotográfica" };
                        await fetch('/api/lista/adicionar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pagina, lista, novoItem, posicao: 'inicio' }) });
                        window.mostrarToast("Fotografia adicionada à galeria! ✅");
                        window.recarregarPaginaSPA();
                    }
                } catch (err) { window.mostrarToast("Erro ao enviar fotografia.", true); }
            };
            inputUpload.click();
            return;
        }

        // 3. EDIÇÃO DE TEXTOS COM PROMPT (Títulos isolados, botões, etc)
        const btnEditCms = e.target.closest('.btn-editar-cms:not([data-tipo="imagem"])');
        if (btnEditCms) {
            const pagina = btnEditCms.getAttribute('data-pagina');
            const chave = btnEditCms.getAttribute('data-chave');
            const elTexto = document.getElementById(`texto-${pagina}-${chave}`);
            const textoAtual = elTexto ? elTexto.innerText : "";
            const novoTexto = prompt(`Editar ${chave}:`, textoAtual);

            if (novoTexto && novoTexto.trim() !== "" && novoTexto !== textoAtual) {
                if(elTexto) elTexto.innerText = novoTexto;
                await fetch('/api/salvar-edicao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pagina, chave, novoTexto }) });
                window.mostrarToast("Salvo com sucesso!");
            }
            return;
        }

        const btnEditLista = e.target.closest('.btn-editar-lista:not([data-campo="imagem"])');
        if (btnEditLista) {
            const pagina = btnEditLista.getAttribute('data-pagina');
            const lista = btnEditLista.getAttribute('data-lista');
            const index = btnEditLista.getAttribute('data-index');
            const campo = btnEditLista.getAttribute('data-campo');
            let elTexto = document.getElementById(`texto-${lista}-${index}-${campo}`);
            const textoAtual = elTexto ? elTexto.innerText : "";
            const novoTexto = prompt(`Editar ${campo}:`, textoAtual);

            if (novoTexto && novoTexto.trim() !== "" && novoTexto !== textoAtual) {
                if(elTexto) elTexto.innerText = novoTexto;
                await fetch('/api/lista/editar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pagina, lista, index, campo, novoTexto }) });
                window.mostrarToast("Atualizado com sucesso!");
            }
            return;
        }

        // 4. CRIAR NOVA NOTÍCIA CORINGA
        const btnCriarNoticia = e.target.closest('#btn-criar-noticia');
        if (btnCriarNoticia) {
            window.mostrarToast("A criar nova edição do Jornal... ⏳");
            try {
                const response = await fetch('/api/noticia/criar', { method: 'POST' });
                const result = await response.json();
                if(result.sucesso) {
                    window.mostrarToast("Notícia criada! Redirecionando...");
                    setTimeout(() => { window.location.href = '/noticia/' + result.id; }, 800);
                }
            } catch (err) { window.mostrarToast("Erro de rede ao criar.", true); }
            return;
        }

        // 5. ADICIONAR EM LISTAS GENÉRICAS
        const btnAddLista = e.target.closest('.btn-adicionar-lista:not(#btn-criar-noticia):not(.btn-adicionar-foto-direto)');
        if (btnAddLista) {
            const pagina = btnAddLista.getAttribute('data-pagina');
            const lista = btnAddLista.getAttribute('data-lista');
            let novoItem = {};
            let posicao = 'fim';

            if (lista === 'capitulos') novoItem = { badge: "NOVO", titulo: "Novo Capítulo", p1: "Texto base...", p2: "", citacao: "", citacaoAutor: "", imagem: "/img/noticia1.jpg" };
            else if (lista === 'timeline') novoItem = { ano: "Ano", titulo: "Novo Marco", texto: "Descrição...", cor: "brand-primary" };
            else if (lista === 'pilares') novoItem = { icone: "✨", titulo: "Novo Pilar", texto: "Descrição...", cor: "blue" };
            else if (lista === 'outros') novoItem = { icone: "🌟", titulo: "Novo Projeto", texto: "Descrição...", corClass: "brand-primary" };

            await fetch('/api/lista/adicionar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pagina, lista, novoItem, posicao }) });
            window.mostrarToast("Adicionado!");
            window.recarregarPaginaSPA();
            return;
        }

        // 6. REMOVER DE LISTAS GENÉRICAS
        const btnRemoveLista = e.target.closest('.btn-remover-lista');
        if (btnRemoveLista) {
            if (confirm("Tem a certeza que deseja apagar isto permanentemente?")) {
                const pagina = btnRemoveLista.getAttribute('data-pagina');
                const lista = btnRemoveLista.getAttribute('data-lista');
                const index = btnRemoveLista.getAttribute('data-index');
                await fetch('/api/lista/remover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pagina, lista, index }) });
                window.mostrarToast("Apagado com sucesso!");
                
                if (window.location.pathname.startsWith('/noticia/')) window.location.href = '/noticias';
                else window.recarregarPaginaSPA();
            }
            return;
        }
        // 7. LIGAR/DESLIGAR PÁGINAS DO MENU (FEATURE TOGGLE)
        const btnTogglePagina = e.target.closest('.btn-toggle-pagina');
        if (btnTogglePagina) {
            const pagina = btnTogglePagina.getAttribute('data-pagina');
            window.mostrarToast("A alterar estado da página... ⏳");
            try {
                const response = await fetch('/api/toggle-pagina', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pagina })
                });
                if (response.ok) {
                    window.mostrarToast("Visibilidade atualizada! ✅");
                    window.recarregarPaginaSPA();
                } else {
                    window.mostrarToast("Sem permissão.", true);
                }
            } catch (err) {
                window.mostrarToast("Erro de rede.", true);
            }
            return;
        }

        // 8. LIGAR/DESLIGAR SECÇÕES ESPECÍFICAS DA PÁGINA
        const btnToggleSeccao = e.target.closest('.btn-toggle-seccao');
        if (btnToggleSeccao) {
            const seccaoId = btnToggleSeccao.getAttribute('data-seccao');
            window.mostrarToast("A alterar estado da secção... ⏳");
            try {
                const response = await fetch('/api/toggle-seccao', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ seccaoId })
                });
                if (response.ok) {
                    window.mostrarToast("Secção atualizada! ✅");
                    window.recarregarPaginaSPA();
                } else {
                    window.mostrarToast("Sem permissão.", true);
                }
            } catch (err) {
                window.mostrarToast("Erro de rede.", true);
            }
            return;
        }
    });    
});