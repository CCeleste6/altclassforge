# Class Forge Roguelike v4.2

Hotfix focado no modo demo e na queda do Gemini.

## O que mudou na v4.2

- O botão **Modo Demo Roguelike** não chama o Gemini em nenhuma situação.
- Se o usuário clicar em **Forjar Dungeon com IA** e o Gemini retornar erro 503, 429, 403 etc., o jogo carrega automaticamente a demo para permitir testar as mecânicas.
- Todos os botões principais agora usam `type="button"` para evitar comportamento inesperado no navegador.
- O cache do GitHub Pages foi forçado com `?v=4.2.0`.
- A chave de save local mudou para `classForgeRoguelikeSaveV42`, evitando conflito com saves antigos.
- As mensagens de erro do Gemini ficaram mais claras.

## Como testar no GitHub Pages

1. Substitua os arquivos do repositório pelos arquivos desta versão.
2. Espere o GitHub Pages atualizar.
3. Abra o site com `Ctrl + F5`.
4. Escolha uma classe.
5. Clique em **Modo Demo Roguelike**.

O Modo Demo Roguelike deve abrir o mapa mesmo sem API Key, sem PDF e sem texto.

## Estrutura

```txt
index.html
css/
  base.css
  layout.css
  components.css
js/
  app.js
  core/
  game/
  services/
  ui/
```
