(function () {
  window.CF = window.CF || {};

  CF.CONFIG = {
    version: '4.1.1-hotfix-demo',
    saveKey: 'classForgeRoguelikeSaveV41',
    legacySaveKeys: ['classForgeSave', 'classForgeRoguelikeSave', 'classForgeRoguelikeSaveV4'],
    maxPdfPages: 6,
    geminiModel: 'gemini-2.5-flash',
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
