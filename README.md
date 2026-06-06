# Class Forge - Roguelike Beta 4.0

Versão modular do Class Forge focada em transformar o antigo quiz em uma run roguelike educacional.

## Como abrir

Abra `index.html` no navegador ou publique a pasta inteira no GitHub Pages.

## Mudanças principais da Beta 4.0

- A aba **Tema do RPG** foi removida.
- O botão **Modo Demo Roguelike** funciona sem API Key, sem matéria e sem texto/PDF.
- Antes da aventura, o jogador escolhe uma classe:
  - **Guerreiro**: aventura equilibrada.
  - **Arqueiro**: aumenta Questões Múltiplas e poderes relacionados.
  - **Ladino**: aumenta Questões Rápidas e poderes relacionados.
  - **Mago**: aumenta Questões Científicas e poderes relacionados.
- O item **Emblema do Grão-Mestre** pode ser equipado antes da aventura.
- Há quatro tipos de questão:
  - Questão Padrão.
  - Questão Múltipla.
  - Questão Científica.
  - Questão Rápida.
- Foram adicionados poderes de run:
  - Ataque Relâmpago.
  - Cronômetro.
  - Cernir.
  - Visão de Água.
  - Duas Flechas, Um Coelho.
  - Linha na Agulha.
  - Mestre Cuca.
  - Despojos.

## Estrutura

```text
class_forge_roguelike_v4/
├── index.html
├── css/
│   ├── base.css
│   ├── layout.css
│   └── components.css
└── js/
    ├── app.js
    ├── core/
    │   ├── config.js
    │   ├── state.js
    │   └── utils.js
    ├── game/
    │   ├── combat.js
    │   ├── dungeon.js
    │   └── loot.js
    ├── services/
    │   ├── gemini.js
    │   ├── pdf-exporter.js
    │   └── pdf-reader.js
    └── ui/
        ├── audio.js
        ├── confetti.js
        ├── map.js
        ├── modal.js
        └── screens.js
```

## Arquivos alterados nesta atualização

- `index.html`
- `css/components.css`
- `js/app.js`
- `js/core/config.js`
- `js/core/state.js`
- `js/core/utils.js`
- `js/game/combat.js`
- `js/game/dungeon.js`
- `js/game/loot.js`
- `js/services/gemini.js`
- `js/services/pdf-exporter.js`
- `js/ui/map.js`
- `js/ui/modal.js`
- `js/ui/screens.js`

Os outros arquivos continuam compatíveis com a versão anterior.
