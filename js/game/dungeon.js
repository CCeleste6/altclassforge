(function () {
  window.CF = window.CF || {};

  const Utils = CF.Utils;

  function getPattern(questionCount) {
    if (questionCount <= 6) return CF.CONFIG.nodePatterns.small;
    if (questionCount <= 9) return CF.CONFIG.nodePatterns.medium;
    return CF.CONFIG.nodePatterns.large;
  }

  function getModeByIndex(index) {
    return ['quiz', 'magic', 'stealth'][index % 3];
  }

  function buildNodes(stages, questionCount) {
    const pattern = getPattern(questionCount);
    const nodes = [];
    let stageIndex = 0;

    pattern.forEach(function (kind, index) {
      const floor = index + 1;
      if (kind === 'battle') {
        const stage = stages[stageIndex];
        nodes.push({
          id: `node-${floor}`,
          floor: floor,
          kind: 'battle',
          stageIndex: stageIndex,
          mode: getModeByIndex(stageIndex),
          title: stage.title,
          desc: stage.desc,
          completed: false
        });
        stageIndex += 1;
        return;
      }

      if (kind === 'boss') {
        const bossStageIndex = Math.min(stageIndex, stages.length - 1);
        const stage = stages[bossStageIndex];
        nodes.push({
          id: `node-${floor}`,
          floor: floor,
          kind: 'boss',
          stageIndex: bossStageIndex,
          bossStep: 0,
          title: stage.title.toLowerCase().includes('boss') ? stage.title : `BOSS: ${stage.title}`,
          desc: stage.desc,
          completed: false
        });
        stageIndex += 1;
        return;
      }

      if (kind === 'treasure') {
        nodes.push({
          id: `node-${floor}`,
          floor: floor,
          kind: 'treasure',
          title: 'Baú da Forja',
          desc: 'Escolha um poder para alterar o rumo da run.',
          completed: false
        });
        return;
      }

      if (kind === 'shop') {
        nodes.push({
          id: `node-${floor}`,
          floor: floor,
          kind: 'shop',
          title: 'Mercador de Runas',
          desc: 'Troque moedas por poder, cura ou defesa.',
          completed: false
        });
        return;
      }

      nodes.push({
        id: `node-${floor}`,
        floor: floor,
        kind: 'camp',
        title: 'Acampamento Seguro',
        desc: 'Recupere forças antes da próxima sequência de casas.',
        completed: false
      });
    });

    return nodes;
  }

  function createRun(stages, settings) {
    const questionCount = Number(settings.questionCount || 9);
    const run = CF.State.createEmptyRun();
    run.meta.subject = settings.subject || 'Modo livre';
    run.meta.theme = settings.theme || 'Fantasia Medieval';
    run.meta.source = settings.source || 'demo';
    run.vouchers = questionCount <= 6 ? 1 : questionCount <= 9 ? 2 : 3;
    run.stages = stages;
    run.nodes = buildNodes(stages, questionCount);
    CF.State.setRun(run);
    CF.State.saveRun();
    return run;
  }

  function getDemoStages(count) {
    const bank = [
      {
        title: 'Goblin da Soma Perdida',
        desc: 'Um goblin contador bloqueia a ponte da Forja e exige lógica básica para liberar passagem.',
        quiz: { question: 'Quanto é 2 + 2?', options: ['2', '3', '4', '5'], correct: 2, hint: 'Some dois pares.' },
        magic: { statement: 'O número 10 é maior que 7.', is_true: true, hint: 'Compare os valores.' },
        stealth: { question: 'Explique o que é uma soma.', answer: 'Soma é uma operação matemática que junta quantidades para obter um total.', keywords: ['operação', 'junta', 'total'], hint: 'Pense em juntar quantidades.' }
      },
      {
        title: 'Espectro da Leitura',
        desc: 'Um espírito exige interpretação antes de revelar o próximo corredor.',
        quiz: { question: 'Qual é a função principal de um resumo?', options: ['Aumentar o texto', 'Apresentar as ideias principais', 'Trocar o tema', 'Esconder informações'], correct: 1, hint: 'Resumo reduz sem perder o essencial.' },
        magic: { statement: 'Um texto pode ter tema e ideia principal.', is_true: true, hint: 'Tema é assunto; ideia principal é o que se diz sobre ele.' },
        stealth: { question: 'Defina ideia principal de um texto.', answer: 'É a informação central que organiza o sentido do texto.', keywords: ['informação', 'central', 'texto'], hint: 'É o centro do sentido.' }
      },
      {
        title: 'Cavaleiro da Hipótese',
        desc: 'Um cavaleiro experimental só aceita respostas com causa e consequência.',
        quiz: { question: 'Em ciências, uma hipótese é:', options: ['Uma pergunta sem resposta', 'Uma explicação provisória testável', 'Um resultado final garantido', 'Uma opinião sem teste'], correct: 1, hint: 'Ela precisa poder ser testada.' },
        magic: { statement: 'Toda hipótese científica deve ser testável.', is_true: true, hint: 'Sem teste, ela não funciona como hipótese científica.' },
        stealth: { question: 'Explique por que experimentos são importantes.', answer: 'Experimentos testam hipóteses e ajudam a verificar evidências.', keywords: ['testam', 'hipóteses', 'evidências'], hint: 'Pense em prova e verificação.' }
      }
    ];

    return Array.from({ length: count }, function (_, index) {
      const template = bank[index % bank.length];
      return JSON.parse(JSON.stringify(template));
    });
  }

  function completeNode(nodeIndex) {
    CF.State.mutate(function (run) {
      const node = run.nodes[nodeIndex];
      if (!node || node.completed) return;
      node.completed = true;
      run.currentNodeIndex = Math.min(nodeIndex + 1, run.nodes.length - 1);
      run.stats.roomsCleared += 1;
      if (node.kind === 'battle' || node.kind === 'boss') run.stats.battlesWon += 1;
    });
  }

  function isUnlocked(index) {
    const run = CF.State.getRun();
    if (index === 0) return true;
    return Boolean(run.nodes[index - 1] && run.nodes[index - 1].completed);
  }

  function isRunComplete() {
    return CF.State.getRun().nodes.length > 0 && CF.State.getRun().nodes.every(function (node) { return node.completed; });
  }

  CF.Dungeon = {
    createRun: createRun,
    getDemoStages: getDemoStages,
    completeNode: completeNode,
    isUnlocked: isUnlocked,
    isRunComplete: isRunComplete
  };
}());
