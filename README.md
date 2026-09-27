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

A área administrativa desta versão foi criada para uso local/prototipação e **não deve ser exposta diretamente à internet sem uma camada real de autenticação e autorização**.

## Observação

Dependências instaladas ficam em `node_modules/` e não são versionadas. Use `npm install` para reconstruí-las a partir de `package.json` e `package-lock.json`.
