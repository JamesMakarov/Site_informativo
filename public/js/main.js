// --- Lógica Interativa do Formulário de Oração ---
    document.addEventListener('submit', async (e) => {
        // Verifica se quem disparou o submit foi o nosso form de oração
        if (e.target && e.target.id === 'form-oracao') {
            e.preventDefault(); // Impede o recarregamento da página

            const form = e.target;
            const btnSubmit = form.querySelector('.btn-submit');
            const btnText = form.querySelector('.btn-text');
            const btnLoader = form.querySelector('.btn-loader');

            // Prepara os dados
            const formData = {
                nome: document.getElementById('nome').value,
                pedido: document.getElementById('pedido').value
            };

            // Animação do botão (Feedback visual pro usuário)
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
            btnSubmit.disabled = true;

            try {
                // Dispara o POST para a nossa API no Node
                const response = await fetch('/api/oracao', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();

                if (result.sucesso) {
                    mostrarToast(result.mensagem);
                    form.reset(); // Limpa o form
                }
            } catch (error) {
                mostrarToast("Erro ao conectar com o servidor.", true);
            } finally {
                // Restaura o botão
                btnText.classList.remove('hidden');
                btnLoader.classList.add('hidden');
                btnSubmit.disabled = false;
            }
        }
    });

    // --- Lógica do Botão de Copiar PIX ---
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'btn-copiar-pix') {
            const inputPix = document.getElementById('chave-pix');
            inputPix.select();
            navigator.clipboard.writeText(inputPix.value).then(() => {
                const btn = e.target;
                const textoOriginal = btn.innerText;
                btn.innerText = "Copiado! ✓";
                btn.style.backgroundColor = "#28a745"; // Verde sucesso
                btn.style.color = "white";
                
                // Mostra nosso Toast elegante também!
                mostrarToast("Chave PIX copiada para a área de transferência!");
                
                setTimeout(() => {
                    btn.innerText = textoOriginal;
                    btn.style.backgroundColor = ""; // Volta pro css padrão
                    btn.style.color = "";
                }, 3000);
            });
        }
    });

    // Função para criar uma notificação flutuante na tela (Toast)
    function mostrarToast(mensagem, isError = false) {
        const toast = document.createElement('div');
        toast.className = `toast ${isError ? 'toast-error' : ''}`;
        toast.innerText = mensagem;
        document.body.appendChild(toast);

        // Animação de entrada
        setTimeout(() => toast.classList.add('show'), 100);
        // Animação de saída e remoção
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }