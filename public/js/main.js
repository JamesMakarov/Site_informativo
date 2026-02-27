document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const contentArea = document.getElementById('app-content');
    const links = document.querySelectorAll('.nav-link');

    links.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault(); // Impede o recarregamento "duro" padrão
            const url = e.target.href;

            // 1. Mostra a tela de carregamento
            loader.classList.remove('hidden');

            try {
                // 2. Faz a requisição pedindo apenas o fragmento (usando o header customizado)
                const response = await fetch(url, {
                    headers: { 'X-Requested-With': 'fetch' }
                });
                const html = await response.text();

                // 3. Atualiza o conteúdo e a URL do navegador
                contentArea.innerHTML = html;
                window.history.pushState(null, '', url);
                
                // Simula um tempinho extra de carregamento para efeito visual (opcional)
                setTimeout(() => { loader.classList.add('hidden'); }, 500);

            } catch (error) {
                console.error('Erro ao carregar a página:', error);
                loader.classList.add('hidden');
            }
        });
    });
});