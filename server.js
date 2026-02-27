const express = require('express');
const app = express();
const path = require('path');

// Configurando o EJS como motor de visualização
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Servindo arquivos estáticos (CSS, JS, Imagens)
app.use(express.static(path.join(__dirname, 'public')));

// Função para renderizar de forma inteligente (completa ou apenas o fragmento)
const renderPage = (req, res, page, title) => {
    // Se a requisição veio do nosso JS (Fetch/AJAX), manda só o conteúdo
    if (req.headers['x-requested-with'] === 'fetch') {
        res.render(page, { title: title, isAjax: true });
    } else {
        // Se for acesso direto, manda o layout completo
        res.render('layout', { bodyPage: page, title: title, isAjax: false });
    }
};

// Nossas Rotas
app.get('/', (req, res) => renderPage(req, res, 'home', 'Início | Congregação das Irmãs'));
app.get('/historia', (req, res) => renderPage(req, res, 'historia', 'Nossa História'));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando majestosamente em http://localhost:${PORT}`);
});