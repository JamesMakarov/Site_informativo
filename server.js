const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs'); 

const multer = require('multer');

// --- CONFIGURAÇÃO DO UPLOAD DE IMAGENS ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, 'public', 'img', 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, 'img_' + Date.now() + Math.round(Math.random() * 1E9) + ext);
    }
});
const upload = multer({ storage: storage });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- BASE DE DADOS ---
const dbPath = path.join(__dirname, 'database.json');
let siteData = {};

function carregarBanco() {
    try {
        if (!fs.existsSync(dbPath)) {
            fs.writeFileSync(dbPath, JSON.stringify({}, null, 2), 'utf8');
        }
        const data = fs.readFileSync(dbPath, 'utf8');
        siteData = JSON.parse(data);

        // --- ADICIONE ESTE BLOCO AQUI ---
        if (!siteData.config) siteData.config = {};
        if (!siteData.config.paginasAtivas) siteData.config.paginasAtivas = {};
        const paginas = ['historia', 'projetos', 'noticias', 'galeria', 'vocacoes', 'casas', 'doacoes', 'oracao'];
        paginas.forEach(p => {
            if (siteData.config.paginasAtivas[p] === undefined) siteData.config.paginasAtivas[p] = true;
        });
        // -------------------------------

    } catch (err) {
        console.error("ERRO AO LER BANCO:", err);
        siteData = {}; 
    }
}
carregarBanco(); 

function salvarBanco() {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(siteData, null, 2), 'utf8');
    } catch (err) {
        console.error("ERRO AO SALVAR BANCO:", err);
    }
}

// ===================================================================
// 1. PRIMEIRO: O MIDDLEWARE QUE DEFINE QUEM É O ADMIN
// ===================================================================
app.use((req, res, next) => {
    const cookies = req.headers.cookie || '';
    res.locals.isAdmin = cookies.includes('adminAuth=true');
    res.locals.siteData = siteData; 
    next();
});

// --- ADICIONE ESTE BLOCO NOVO AQUI ---
// BLOQUEIO DE PÁGINAS DESLIGADAS PARA O PÚBLICO
app.use((req, res, next) => {
    // Se for admin, ou rotas de API/imagens, passa sempre
    if (res.locals.isAdmin || req.path === '/' || req.path.startsWith('/api') || req.path.startsWith('/img') || req.path.startsWith('/css') || req.path.startsWith('/js')) {
        return next();
    }
    
    // Descobre que página a pessoa quer acessar (ex: /projetos)
    const paginaRequisitada = req.path.split('/')[1];
    
    // Se a página estiver false (desligada), joga a pessoa pra Home
    if (siteData.config && siteData.config.paginasAtivas && siteData.config.paginasAtivas[paginaRequisitada] === false) {
        return res.redirect('/');
    }
    next();
});
// ------------------------------------


// ===================================================================
// 2. DEPOIS: A ROTA DE UPLOAD (Agora ela sabe que você é Admin!)
// ===================================================================
app.post('/api/upload', upload.single('imagem'), (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false, mensagem: "Acesso negado" });
    if (!req.file) return res.status(400).json({ sucesso: false, mensagem: "Sem ficheiro" });

    try {
        const caminhoImagem = '/img/uploads/' + req.file.filename;
        const { pagina, lista, index, campo, chave } = req.body;

        let caminhoAntigo = '';

        if (lista && lista !== 'undefined' && lista !== 'null') {
            if (!siteData[pagina]) siteData[pagina] = {};
            if (!siteData[pagina][lista]) siteData[pagina][lista] = [];
            if (!siteData[pagina][lista][index]) siteData[pagina][lista][index] = {};
            
            caminhoAntigo = siteData[pagina][lista][index][campo];
            siteData[pagina][lista][index][campo] = caminhoImagem;
        } else if (chave && chave !== 'undefined' && chave !== 'null') {
            if (!siteData[pagina]) siteData[pagina] = {};
            
            caminhoAntigo = siteData[pagina][chave];
            siteData[pagina][chave] = caminhoImagem;
        }

        salvarBanco(); 

        if (caminhoAntigo && typeof caminhoAntigo === 'string' && caminhoAntigo.startsWith('/img/uploads/')) {
            const fsPath = path.join(__dirname, 'public', caminhoAntigo);
            if (fs.existsSync(fsPath)) {
                fs.unlinkSync(fsPath);
            }
        }

        res.json({ sucesso: true, url: caminhoImagem });
    } catch (error) {
        console.error("ERRO UPLOAD:", error);
        res.status(500).json({ sucesso: false, mensagem: "Falha interna" });
    }
});


// --- ROTAS DO PAINEL ADMIN ---
app.get('/painel-diretoria', (req, res) => {
    res.setHeader('Set-Cookie', 'adminAuth=true; Path=/; HttpOnly');
    res.redirect('/');
});

app.get('/sair-painel', (req, res) => {
    res.setHeader('Set-Cookie', 'adminAuth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    res.redirect('/');
});

// --- API DO CMS (Textos) ---
app.post('/api/salvar-edicao', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    const { pagina, chave, novoTexto } = req.body;
    if (!siteData[pagina]) siteData[pagina] = {};
    siteData[pagina][chave] = novoTexto;
    salvarBanco(); 
    res.json({ sucesso: true });
});

// --- ADICIONE ESTA ROTA NOVA AQUI ---
app.post('/api/toggle-pagina', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    const { pagina } = req.body;
    
    // Inverte o estado (se for true vira false, se for false vira true)
    siteData.config.paginasAtivas[pagina] = !siteData.config.paginasAtivas[pagina];
    salvarBanco();
    
    res.json({ sucesso: true });
});

// --- ROTA PARA LIGAR/DESLIGAR SECÇÕES ESPECÍFICAS ---
app.post('/api/toggle-seccao', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    
    const { seccaoId } = req.body;
    
    // Se a árvore de config não existir, cria-a para evitar erros
    if (!siteData.config) siteData.config = {};
    if (!siteData.config.seccoesAtivas) siteData.config.seccoesAtivas = {};

    // Se a secção nunca foi mexida, assume que estava true e agora passa a false.
    // Caso contrário, inverte o estado atual.
    if (siteData.config.seccoesAtivas[seccaoId] === undefined) {
        siteData.config.seccoesAtivas[seccaoId] = false;
    } else {
        siteData.config.seccoesAtivas[seccaoId] = !siteData.config.seccoesAtivas[seccaoId];
    }
    
    salvarBanco();
    res.json({ sucesso: true, estado: siteData.config.seccoesAtivas[seccaoId] });
});

// --- API DO CARROSSEL DE DEPOIMENTOS ---
app.post('/api/depoimento/editar', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    const { index, campo, novoTexto } = req.body;
    siteData.home.depoimentos[index][campo] = novoTexto;
    salvarBanco();
    res.json({ sucesso: true });
});

app.post('/api/depoimento/adicionar', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    if (!siteData.home.depoimentos) siteData.home.depoimentos = [];
    siteData.home.depoimentos.push({ texto: "Novo testemunho...", autor: "Nome", papel: "Cargo" });
    salvarBanco(); 
    res.json({ sucesso: true });
});

app.post('/api/depoimento/remover', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    siteData.home.depoimentos.splice(req.body.index, 1);
    salvarBanco(); 
    res.json({ sucesso: true });
});

// --- API DA FAQ ---
app.post('/api/faq/editar', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    const { index, campo, novoTexto } = req.body;
    siteData.home.faqs[index][campo] = novoTexto;
    salvarBanco(); 
    res.json({ sucesso: true });
});

app.post('/api/faq/adicionar', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    if (!siteData.home.faqs) siteData.home.faqs = [];
    siteData.home.faqs.push({ pergunta: "Nova Pergunta?", resposta: "Resposta aqui." });
    salvarBanco(); 
    res.json({ sucesso: true });
});

app.post('/api/faq/remover', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    siteData.home.faqs.splice(req.body.index, 1);
    salvarBanco(); 
    res.json({ sucesso: true });
});

// --- API DAS LISTAS DA AÇÃO SOCIAL ---
app.post('/api/lista/editar', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    const { pagina, lista, index, campo, novoTexto } = req.body;
    siteData[pagina][lista][index][campo] = novoTexto;
    salvarBanco(); 
    res.json({ sucesso: true });
});

app.post('/api/lista/adicionar', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    
    // Agora o servidor recebe a "posicao"
    const { pagina, lista, novoItem, posicao } = req.body;
    
    if (!siteData[pagina][lista]) siteData[pagina][lista] = [];
    
    // MÁGICA: Se a posição for 'inicio', ele usa unshift (coloca no índice 0)
    if (posicao === 'inicio') {
        siteData[pagina][lista].unshift(novoItem);
    } else {
        siteData[pagina][lista].push(novoItem);
    }
    
    salvarBanco();
    res.json({ sucesso: true });
});

app.post('/api/lista/remover', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    const { pagina, lista, index } = req.body;
    siteData[pagina][lista].splice(index, 1);
    salvarBanco();
    res.json({ sucesso: true });
});

// --- SISTEMA DE RENDERIZAÇÃO ---
const renderPage = (req, res, page, title) => {
    if (req.headers['x-requested-with'] === 'fetch') {
        res.render(page, { title: title, isAjax: true });
    } else {
        res.render('layout', { bodyPage: page, title: title, isAjax: false });
    }
};

// ===================================================================
// ROTAS DINÂMICAS DE NOTÍCIAS (PÁGINA CORINGA)
// ===================================================================

// 1. Rota que cria a notícia com DATA AUTOMÁTICA e devolve o ID
app.post('/api/noticia/criar', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    
    // Gerar a data de hoje (ex: 01 Mar 2026)
    const dataAtual = new Date();
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const dataFormatada = `${String(dataAtual.getDate()).padStart(2, '0')} ${meses[dataAtual.getMonth()]} ${dataAtual.getFullYear()}`;

    const novoId = 'noticia_' + Date.now(); 
    
    const novaNoticia = {
        id: novoId,
        badgeCor: "red-500",
        badge: "NOVA",
        data: dataFormatada,
        titulo: "Clique aqui para editar o Título",
        texto: "Clique aqui para editar o resumo da página inicial...",
        conteudoCompleto: "Apague este texto e escreva aqui a reportagem completa. Para mudar de parágrafo, basta dar Enter.",
        autor: "Equipe de Comunicação",
        fotoAutor: "", // Começa vazio!
        imagem: "/img/noticia1.jpg", // Usa uma local para não haver carregamento infinito
        isEmoji: false,
        emoji: ""
    };

    if (!siteData.noticias.feedList) siteData.noticias.feedList = [];
    
    siteData.noticias.feedList.unshift(novaNoticia); // Vai direto para o TOPO
    salvarBanco();
    
    res.json({ sucesso: true, id: novoId });
});

// 2. Rota que renderiza a página da notícia com base no ID
app.get('/noticia/:id', (req, res) => {
    const noticia = siteData.noticias.feedList.find(n => n.id === req.params.id);
    if (!noticia) return res.redirect('/noticias'); // Se não achar, volta pro feed
    
    const index = siteData.noticias.feedList.findIndex(n => n.id === req.params.id);

    if (req.headers['x-requested-with'] === 'fetch') {
        res.render('noticia-interna', { title: noticia.titulo, noticia, index, isAjax: true });
    } else {
        res.render('layout', { bodyPage: 'noticia-interna', title: noticia.titulo, noticia, index, isAjax: false });
    }
});

// --- ROTAS DO SITE ---
app.get('/', (req, res) => renderPage(req, res, 'home', 'Início | Congregação'));
app.get('/historia', (req, res) => renderPage(req, res, 'historia', 'Nossa História'));
app.get('/projetos', (req, res) => renderPage(req, res, 'projetos', 'Ação Social'));
app.get('/noticias', (req, res) => {
    res.locals.currentPage = parseInt(req.query.page) || 1;
    renderPage(req, res, 'noticias', 'Notícias');
});
app.get('/vocacoes', (req, res) => renderPage(req, res, 'vocacoes', 'Vocações'));
app.get('/casas', (req, res) => renderPage(req, res, 'casas', 'Nossas Casas'));
app.get('/doacoes', (req, res) => renderPage(req, res, 'doacoes', 'Doações'));
app.get('/oracao', (req, res) => renderPage(req, res, 'oracao', 'Pedidos de Oração'));
app.get('/galeria', (req, res) => renderPage(req, res, 'galeria', 'Nossa Galeria'));

app.post('/api/oracao', (req, res) => {
    const { nome } = req.body;
    setTimeout(() => res.json({ sucesso: true, mensagem: `Paz e bem, ${nome}. Seu pedido foi acolhido.` }), 1200);
});

app.listen(3000, () => {
    console.log(`Servidor rodando em http://localhost:3000`);
});