const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs'); // OBRIGATÓRIO PARA LER/GRAVAR FICHEIROS

const multer = require('multer'); // Importa a biblioteca

// --- CONFIGURAÇÃO DO UPLOAD DE IMAGENS ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Define a pasta onde as imagens vão ficar guardadas
        const dir = path.join(__dirname, 'public', 'img', 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Cria um nome único: ex: img_16930000_12345.jpg
        const ext = path.extname(file.originalname);
        cb(null, 'img_' + Date.now() + Math.round(Math.random() * 1E9) + ext);
    }
});
const upload = multer({ storage: storage });

// --- ROTA DA API QUE RECEBE, GUARDA E APAGA A IMAGEM ANTIGA ---
app.post('/api/upload', upload.single('imagem'), (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    if (!req.file) return res.status(400).json({ sucesso: false, mensagem: "Sem ficheiro" });

    try {
        const caminhoImagem = '/img/uploads/' + req.file.filename;
        const { pagina, lista, index, campo, chave } = req.body;

        let caminhoAntigo = '';

        // 1. Atualiza a memória e guarda o caminho antigo para o podermos apagar
        if (lista) {
            // Previne erros caso a lista ainda não exista no JSON
            if (!siteData[pagina][lista]) siteData[pagina][lista] = [];
            if (!siteData[pagina][lista][index]) siteData[pagina][lista][index] = {};
            
            caminhoAntigo = siteData[pagina][lista][index][campo];
            siteData[pagina][lista][index][campo] = caminhoImagem;
        } else if (chave) {
            if (!siteData[pagina]) siteData[pagina] = {};
            
            caminhoAntigo = siteData[pagina][chave];
            siteData[pagina][chave] = caminhoImagem;
        }

        // Grava no ficheiro JSON
        salvarBanco(); 

        // 2. APAGA A IMAGEM ANTIGA (Lixeira Automática)
        if (caminhoAntigo && caminhoAntigo.startsWith('/img/uploads/')) {
            const fsPath = path.join(__dirname, 'public', caminhoAntigo);
            if (fs.existsSync(fsPath)) {
                fs.unlinkSync(fsPath);
                console.log('🗑️ Imagem antiga apagada do disco:', fsPath);
            }
        }

        // Devolve sucesso ao Front-end
        res.json({ sucesso: true, url: caminhoImagem });

    } catch (error) {
        console.error("❌ Erro fatal ao processar o upload no JSON:", error);
        res.status(500).json({ sucesso: false });
    }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- BASE DE DADOS BLINDADA ---
const dbPath = path.join(__dirname, 'database.json');
let siteData = {};

function carregarBanco() {
    try {
        // Se o ficheiro não existir, cria um vazio para não dar erro
        if (!fs.existsSync(dbPath)) {
            console.log("⚠️ Ficheiro database.json não encontrado. A criar um novo...");
            fs.writeFileSync(dbPath, JSON.stringify({}, null, 2), 'utf8');
        }
        const data = fs.readFileSync(dbPath, 'utf8');
        siteData = JSON.parse(data);
        console.log("✅ Banco de dados carregado com sucesso!");
    } catch (err) {
        console.error("❌ ERRO GRAVE ao ler o banco de dados:", err);
        siteData = {}; // Evita quebrar o site inteiro
    }
}
carregarBanco(); // Carrega ao iniciar o servidor

function salvarBanco() {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(siteData, null, 2), 'utf8');
        console.log("💾 Alteração guardada com sucesso no database.json!");
    } catch (err) {
        console.error("❌ ERRO GRAVE ao salvar no banco de dados:", err);
    }
}

// --- MIDDLEWARE DE AUTENTICAÇÃO INLINE ---
app.use((req, res, next) => {
    const cookies = req.headers.cookie || '';
    res.locals.isAdmin = cookies.includes('adminAuth=true');
    res.locals.siteData = siteData; 
    next();
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

// --- API DO CMS (Rota para SALVAR as edições) ---
app.post('/api/salvar-edicao', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    const { pagina, chave, novoTexto } = req.body;
    
    if (!siteData[pagina]) siteData[pagina] = {};
    siteData[pagina][chave] = novoTexto;
    
    salvarBanco(); // GRAVAÇÃO BLINDADA
    res.json({ sucesso: true });
});

// --- API DO CARROSSEL DE DEPOIMENTOS ---
app.post('/api/depoimento/editar', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    const { index, campo, novoTexto } = req.body;
    siteData.home.depoimentos[index][campo] = novoTexto;
    salvarBanco(); // GRAVAÇÃO BLINDADA
    res.json({ sucesso: true });
});

app.post('/api/depoimento/adicionar', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    if (!siteData.home.depoimentos) siteData.home.depoimentos = [];
    siteData.home.depoimentos.push({ texto: "Novo testemunho...", autor: "Nome", papel: "Cargo" });
    salvarBanco(); // GRAVAÇÃO BLINDADA
    res.json({ sucesso: true });
});

app.post('/api/depoimento/remover', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    siteData.home.depoimentos.splice(req.body.index, 1);
    salvarBanco(); // GRAVAÇÃO BLINDADA
    res.json({ sucesso: true });
});

// --- API DA FAQ ---
app.post('/api/faq/editar', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    const { index, campo, novoTexto } = req.body;
    siteData.home.faqs[index][campo] = novoTexto;
    salvarBanco(); // GRAVAÇÃO BLINDADA
    res.json({ sucesso: true });
});

app.post('/api/faq/adicionar', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    if (!siteData.home.faqs) siteData.home.faqs = [];
    siteData.home.faqs.push({ pergunta: "Nova Pergunta?", resposta: "Resposta aqui." });
    salvarBanco(); // GRAVAÇÃO BLINDADA
    res.json({ sucesso: true });
});

app.post('/api/faq/remover', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    siteData.home.faqs.splice(req.body.index, 1);
    salvarBanco(); // GRAVAÇÃO BLINDADA
    res.json({ sucesso: true });
});

// --- API DAS LISTAS DA AÇÃO SOCIAL ---
app.post('/api/lista/editar', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    const { pagina, lista, index, campo, novoTexto } = req.body;
    siteData[pagina][lista][index][campo] = novoTexto;
    salvarBanco(); // GRAVAÇÃO BLINDADA
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

// --- API GENÉRICA PARA ADICIONAR EM QUALQUER LISTA ---
app.post('/api/lista/adicionar', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    const { pagina, lista, novoItem } = req.body;
    
    if (!siteData[pagina][lista]) siteData[pagina][lista] = [];
    siteData[pagina][lista].push(novoItem);
    
    salvarBanco();
    res.json({ sucesso: true });
});

// --- API GENÉRICA PARA REMOVER DE QUALQUER LISTA ---
app.post('/api/lista/remover', (req, res) => {
    if (!res.locals.isAdmin) return res.status(403).json({ sucesso: false });
    const { pagina, lista, index } = req.body;
    
    siteData[pagina][lista].splice(index, 1);
    salvarBanco();
    res.json({ sucesso: true });
});

// --- ROTAS DO SITE ---
app.get('/', (req, res) => renderPage(req, res, 'home', 'Início | Congregação'));
app.get('/historia', (req, res) => renderPage(req, res, 'historia', 'Nossa História'));
app.get('/projetos', (req, res) => renderPage(req, res, 'projetos', 'Ação Social'));
app.get('/noticias', (req, res) => renderPage(req, res, 'noticias', 'Notícias'));
app.get('/vocacoes', (req, res) => renderPage(req, res, 'vocacoes', 'Vocações'));
app.get('/casas', (req, res) => renderPage(req, res, 'casas', 'Nossas Casas'));
app.get('/doacoes', (req, res) => renderPage(req, res, 'doacoes', 'Doações'));
app.get('/oracao', (req, res) => renderPage(req, res, 'oracao', 'Pedidos de Oração'));

app.post('/api/oracao', (req, res) => {
    const { nome } = req.body;
    setTimeout(() => res.json({ sucesso: true, mensagem: `Paz e bem, ${nome}. Seu pedido foi acolhido.` }), 1200);
});

app.listen(3000, () => {
    console.log(`Servidor robusto rodando em http://localhost:3000`);
});