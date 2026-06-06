(function () {
  window.CF = window.CF || {};

  CF.CONFIG = {
    version: '4.3.0-hotfix-ai-stable',
    saveKey: 'classForgeRoguelikeSaveV43',
    legacySaveKeys: [
      'classForgeSave',
      'classForgeRoguelikeSave',
      'classForgeRoguelikeSaveV4',
      'classForgeRoguelikeSaveV41',
      'classForgeRoguelikeSaveV42'
    ],
    maxPdfPages: 6,

    // O modo "pra valer" usa o primeiro modelo selecionado e, se houver 429/500/503/504,
    // tenta modelos alternativos automaticamente antes de desistir.
    geminiModel: 'gemini-2.5-flash-lite',
    geminiModels: [
      {
        id: 'gemini-2.5-flash-lite',
        label: 'Estável - Gemini 2.5 Flash-Lite',
        desc: 'Mais leve e rápido. Recomendado para GitHub Pages e teste real.'
      },
      {
        id: 'gemini-2.5-flash',
        label: 'Qualidade - Gemini 2.5 Flash',
        desc: 'Melhor qualidade geral, mas pode sobrecarregar mais vezes.'
      },
      {
        id: 'gemini-flash-latest',
        label: 'Automático - Gemini Flash Latest',
        desc: 'Alias do Google para a versão Flash mais recente.'
      }
    ],
    geminiFallbackModels: ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest'],
    geminiMaxAttemptsPerModel: 2,
    geminiRetryBaseDelayMs: 900,
    geminiRequestTimeoutMs: 45000,

    baseWrongDamage: 15,
    quickBaseSeconds: 25,
    quickPerfectSeconds: 10,
    maxChronometers: 3,
    baseRewards: {
      standard: 10,
      multiple: 12,
      scientific: 14,
      quick: 12,
      boss: 40
    },
    questionTypes: {
      standard: {
        label: 'Questão Padrão',
        short: 'Padrão',
        icon: '⚔️',
        desc: 'Alternativas A, B, C e D.'
      },
      multiple: {
        label: 'Questão Múltipla',
        short: 'Múltipla',
        icon: '🏹',
        desc: 'Marque cada afirmação como verdadeira ou falsa.'
      },
      scientific: {
        label: 'Questão Científica',
        short: 'Científica',
        icon: '🔬',
        desc: 'Enunciado maior com informações vitais.'
      },
      quick: {
        label: 'Questão Rápida',
        short: 'Rápida',
        icon: '🗡️',
        desc: 'Pergunta simples com tempo limite.'
      }
    },
    classes: {
      warrior: {
        label: 'Guerreiro',
        icon: '🛡️',
        desc: 'Aventura equilibrada. Nenhuma chance especial é aplicada.',
        weights: { standard: 40, multiple: 20, scientific: 20, quick: 20 },
        preferredTags: []
      },
      archer: {
        label: 'Arqueiro',
        icon: '🏹',
        desc: 'Aumenta bastante a chance de Questões Múltiplas e poderes ligados a elas.',
        weights: { standard: 25, multiple: 48, scientific: 14, quick: 13 },
        preferredTags: ['multiple']
      },
      rogue: {
        label: 'Ladino',
        icon: '🗡️',
        desc: 'Aumenta bastante a chance de Questões Rápidas e poderes ligados a tempo/recompensa.',
        weights: { standard: 25, multiple: 14, scientific: 13, quick: 48 },
        preferredTags: ['quick', 'gold']
      },
      mage: {
        label: 'Mago',
        icon: '🔮',
        desc: 'Aumenta bastante a chance de Questões Científicas e poderes ligados a informação.',
        weights: { standard: 25, multiple: 13, scientific: 48, quick: 14 },
        preferredTags: ['scientific']
      }
    },
    grandmaster: {
      label: 'Grão-Mestre',
      icon: '🏵️',
      desc: 'Conta como Arqueiro, Ladino e Mago. Questão Padrão não aparece. Recompensas dobradas.',
      weights: { standard: 0, multiple: 34, scientific: 33, quick: 33 },
      preferredTags: ['multiple', 'scientific', 'quick', 'gold']
    },
    eventCycle: ['treasure', null, 'camp', null, 'shop', null, 'treasure', null, 'camp', null, 'shop', null]
  };
}());
