# Institutional Website CMS

Protótipo de site institucional construído com **Node.js, Express e EJS**, com conteúdo administrável, upload de imagens e páginas renderizadas no servidor.

O projeto inclui uma área de edição usada para alterar textos, listas, notícias, imagens e a visibilidade de páginas sem modificar diretamente os templates.

## Funcionalidades

- páginas institucionais renderizadas com EJS;
- conteúdo armazenado em JSON;
- edição de textos pelo painel;
- criação, edição e remoção de notícias;
- gerenciamento de FAQ e depoimentos;
- upload e substituição de imagens com Multer;
- ativação e desativação de páginas e seções;
- galeria, projetos, história, notícias, doações e pedidos de oração;
- respostas parciais para navegação via `fetch`.

## Tecnologias

- Node.js
- Express 5
- EJS
- Multer
- JavaScript
- HTML/CSS

## Estrutura

```text
.
├── public/          # arquivos estáticos
├── views/           # templates EJS
├── database.json    # conteúdo usado pelo protótipo
├── server.js        # servidor e rotas
├── package.json
└── package-lock.json
```

## Executando

### Requisitos

- Node.js
- npm

Clone o repositório:

```bash
git clone https://github.com/JamesMakarov/Site_informativo.git
cd Site_informativo
```

Instale as dependências:

```bash
npm install
```

Inicie o servidor:

```bash
npm start
```

A aplicação fica disponível em:

```text
http://localhost:3000
```

## Persistência

Este projeto usa `database.json` como armazenamento simples de conteúdo. Isso facilita a execução local e a demonstração do CMS, mas não substitui um banco de dados em uma aplicação de produção.

## Segurança

O painel administrativo exige duas variáveis de ambiente:

- `ADMIN_PASSWORD`: senha usada no login;
- `ADMIN_SECRET`: segredo usado para gerar o token do cookie administrativo.

Exemplo no Linux/macOS:

```bash
export ADMIN_PASSWORD="change-me"
export ADMIN_SECRET="use-a-long-random-secret"
npm start
```

PowerShell:

```powershell
$env:ADMIN_PASSWORD="change-me"
$env:ADMIN_SECRET="use-a-long-random-secret"
npm start
```

Sem essas variáveis, o painel administrativo permanece desabilitado.

O cookie administrativo é `HttpOnly`, `SameSite=Lax` e recebe a flag `Secure` quando `NODE_ENV=production`.

Apesar dessa proteção, o projeto continua sendo um protótipo e precisaria de controles adicionais antes de um uso público de produção.

## Observação

Dependências instaladas ficam em `node_modules/` e não são versionadas. Use `npm install` para reconstruí-las a partir de `package.json` e `package-lock.json`.
