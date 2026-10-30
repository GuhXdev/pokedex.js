# Pokédex Moderna — Vercel

Versão estática em HTML, CSS e JavaScript, pronta para hospedagem na Vercel. Os dados são consultados diretamente na [PokéAPI](https://pokeapi.co/).

## Recursos
- Layout responsivo para celular, tablet e desktop.
- Busca por nome ou número.
- Pokémon aleatório.
- Filtros por tipo.
- Cards com arte oficial, tipo, altura e peso.
- Modal com detalhes e atributos básicos.
- Não exige build, banco de dados, chaves ou backend.

## Publicar na Vercel
1. Extraia o conteúdo deste ZIP.
2. Envie os arquivos `index.html`, `style.css`, `script.js`, `vercel.json` e `README.md` para um repositório no GitHub.
3. Entre na [Vercel](https://vercel.com/), escolha **Add New → Project** e importe esse repositório.
4. Como é um site estático, deixe o framework como **Other** e não configure Build Command nem Output Directory.
5. Clique em **Deploy**.

Também é possível fazer deploy com a CLI da Vercel, dentro desta pasta, usando `vercel`.

## Observações
- O site precisa de conexão com a internet para carregar dados e imagens da PokéAPI.
- Esta versão substitui o front-end PHP por uma versão estática. O projeto CodeIgniter original não foi removido nem alterado dentro do ZIP enviado.
- A Vercel hospeda esta versão estática sem executar o backend PHP original.
