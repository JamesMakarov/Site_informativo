const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// MIDDLEWARES: Ensinam o Express a entender requisições POST com JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const renderPage = (req, res, page, title) => {
    if (req.headers['x-requested-with'] === 'fetch') {
        res.render(page, { title: title, isAjax: true });
    } else {
        res.render('layout', { bodyPage: page, title: title, isAjax: false });
    }
};

// Rotas de Páginas
app.get('/', (req, res) => renderPage(req, res, 'home', 'Início | Congregação'));
app.get('/historia', (req, res) => renderPage(req, res, 'historia', 'Nossa História'));
app.get('/projetos', (req, res) => renderPage(req, res, 'projetos', 'Projetos Sociais'));
app.get('/oracao', (req, res) => renderPage(req, res, 'oracao', 'Pedidos de Oração'));

// NOVAS ROTAS
app.get('/noticias', (req, res) => renderPage(req, res, 'noticias', 'Notícias | Congregação'));
app.get('/vocacoes', (req, res) => renderPage(req, res, 'vocacoes', 'Desperte sua Vocação'));
app.get('/doacoes', (req, res) => renderPage(req, res, 'doacoes', 'Ajude nossa Obra'));

// Rota de API (Nós recebemos o POST do form aqui)
app.post('/api/oracao', (req, res) => {
    const { nome, pedido } = req.body;
    console.log(`Novo pedido de oração de ${nome}: ${pedido}`);
    
    // Simulando um delay de banco de dados para a página de carregamento aparecer
    setTimeout(() => {
        res.json({ 
            sucesso: true, 
            mensagem: `Paz e bem, ${nome}. Seu pedido foi acolhido por nossas irmãs.` 
        });
    }, 1200);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor turbo rodando em http://localhost:${PORT}`);
});