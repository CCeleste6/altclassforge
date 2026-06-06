# Class Forge - Roguelike Beta 3.0

Esta versão separa o antigo `index.html` em arquivos menores e transforma o fluxo em um MVP roguelike educacional.

## Como abrir

Abra `index.html` no navegador. O projeto usa CDN para PDF.js, jsPDF e fontes do Google.

## Estrutura

```text
class_forge_roguelike_modular/
├── index.html
├── css/
│   ├── base.css
│   ├── layout.css
│   └── components.css
└── js/
    ├── core/
    │   ├── config.js
    │   ├── utils.js
    │   └── state.js
    ├── services/
    │   ├── gemini.js
    │   ├── pdf-exporter.js
    │   └── pdf-reader.js
    ├── game/
    │   ├── combat.js
    │   ├── dungeon.js
    │   └── loot.js
    └── ui/
        ├── audio.js
        ├── confetti.js
        ├── map.js
        ├── modal.js
        └── screens.js
```

## Loop roguelike implementado

- Run linear por casas.
- Casas de questão: Quiz, Verdadeiro/Falso e Resposta Aberta.
- Casa de boss com 3 fases: Quiz → V/F → Aberta.
- Casas de tesouro, loja e descanso.
- Moedas de troca da run.
- Power-ups acumuláveis.
- HP, dicas, escudos e estatísticas.
- Salvamento em localStorage.
- Exportação de prova e gabarito em PDF.

## Próximos patches recomendados

1. Sistema de caminhos ramificados: escolher entre 2 ou 3 casas próximas.
2. Loja mais completa com raridades de power-up.
3. Relatório por aluno com nome, turma e histórico.
4. Backend para proteger a API Key do Gemini.
5. Balanceamento de dificuldade por série escolar.
