(function () {
  window.CF = window.CF || {};

  const CONFIG = CF.CONFIG;
  const Utils = CF.Utils;

  function defaultQuiz(title) {
    return {
      question: `Qual alternativa melhor resolve o desafio de ${title}?`,
      options: ['A alternativa correta', 'Uma resposta parecida, mas incompleta', 'Uma distração comum', 'Uma afirmação sem relação'],
      correct: 0,
      hint: 'Procure a alternativa mais completa.'
    };
  }

  function normalizeOptions(rawOptions, fallback) {
    const options = Array.isArray(rawOptions) ? rawOptions.map(String).filter(Boolean) : [];
    while (options.length < 4) options.push((fallback || ['Opção A', 'Opção B', 'Opção C', 'Opção D'])[options.length] || `Opção ${options.length + 1}`);
    return options.slice(0, 4);
  }

  function normalizeStage(stage, index) {
    const raw = stage || {};
    const title = String(raw.title || `Guardião da Casa ${index + 1}`);
    const desc = String(raw.desc || 'Uma casa de desafio surgiu no caminho da Forja.');
    const quizSource = raw.standard || raw.quiz || defaultQuiz(title);
    const magicSource = raw.multiple || raw.magic || {};
    const scientificSource = raw.scientific || {};
    const quickSource = raw.quick || {};
    const standardOptions = normalizeOptions(quizSource.options, ['Correta', 'Parcial', 'Incorreta', 'Armadilha']);
    const quickOptions = normalizeOptions(quickSource.options || quizSource.options, standardOptions);
    const scientificOptions = normalizeOptions(scientificSource.options || quizSource.options, standardOptions);

    let statements = [];
    if (Array.isArray(magicSource.statements)) {
      statements = magicSource.statements.slice(0, 4).map(function (item, statementIndex) {
        return {
          text: String(item.text || item.statement || `Afirmação ${statementIndex + 1}`),
          is_true: Boolean(item.is_true ?? item.true ?? item.correct)
        };
      });
    }
    if (!statements.length && magicSource.statement) {
      statements = [
        { text: String(magicSource.statement), is_true: Boolean(magicSource.is_true) },
        { text: `A afirmação anterior não depende de interpretação do enunciado.`, is_true: false }
      ];
    }
    while (statements.length < 3) {
      statements.push({ text: `Afirmação complementar ${statements.length + 1} sobre o conteúdo.`, is_true: statements.length % 2 === 0 });
    }

    const vitalInfo = Array.isArray(scientificSource.vitalInfo)
      ? scientificSource.vitalInfo.map(String).filter(Boolean)
      : Array.isArray(scientificSource.vital_info)
        ? scientificSource.vital_info.map(String).filter(Boolean)
        : ['Observe os dados do enunciado.', 'Separe causa, consequência e conceito principal.'];

    return {
      title: title,
      desc: desc,
      standard: {
        question: String(quizSource.question || defaultQuiz(title).question),
        options: standardOptions,
        correct: Utils.correctIndexFromValue(quizSource.correct, standardOptions),
        hint: String(quizSource.hint || 'Elimine as alternativas impossíveis primeiro.')
      },
      multiple: {
        question: String(magicSource.question || 'Classifique as afirmações abaixo como verdadeiras ou falsas.'),
        statements: statements,
        hint: String(magicSource.hint || 'Leia cada afirmação separadamente; algumas podem ser parcialmente verdadeiras, mas ainda falsas.')
      },
      scientific: {
        context: String(scientificSource.context || scientificSource.enunciado || desc),
        vitalInfo: vitalInfo,
        question: String(scientificSource.question || quizSource.question || 'Com base nos dados, selecione a conclusão correta.'),
        options: scientificOptions,
        correct: Utils.correctIndexFromValue(scientificSource.correct ?? quizSource.correct, scientificOptions),
        hint: String(scientificSource.hint || 'Use somente as informações do enunciado e os conceitos estudados.')
      },
      quick: {
        question: String(quickSource.question || quizSource.question || 'Responda rapidamente ao desafio.'),
        options: quickOptions,
        correct: Utils.correctIndexFromValue(quickSource.correct ?? quizSource.correct, quickOptions),
        hint: String(quickSource.hint || 'A resposta rápida costuma estar no conceito mais direto.'),
        seconds: Number(quickSource.seconds || CONFIG.quickBaseSeconds)
      }
    };
  }

  function fallbackClassConfig() {
    return {
      label: 'Guerreiro',
      icon: '🛡️',
      desc: 'Aventura equilibrada.',
      weights: { standard: 40, multiple: 20, scientific: 20, quick: 20 },
      preferredTags: []
    };
  }

  function getEffectiveClass(settings) {
    const safeSettings = settings || {};
    const classes = CONFIG.classes || {};
    if (safeSettings.emblemEquipped && CONFIG.grandmaster) return CONFIG.grandmaster;
    return classes[safeSettings.classId] || classes.warrior || fallbackClassConfig();
  }

  function normalizeQuestionType(type) {
    return (CONFIG.questionTypes && CONFIG.questionTypes[type]) ? type : 'standard';
  }

  function questionTypeConfig(type) {
    return (CONFIG.questionTypes && CONFIG.questionTypes[normalizeQuestionType(type)]) || {
      label: 'Questão Padrão',
      short: 'Padrão',
      icon: '⚔️'
    };
  }

  function pickQuestionType(settings, previousType) {
    const classConfig = getEffectiveClass(settings);
    const weights = Object.assign({}, classConfig.weights || fallbackClassConfig().weights);
    if (previousType && CF.State && CF.State.hasPower && CF.State.hasPower('master_chef')) {
      weights[previousType] = 0;
    }
    return normalizeQuestionType(Utils.weightedPick(weights));
  }

  function getEventAfterQuestion(questionIndex) {
    return CONFIG.eventCycle[questionIndex % CONFIG.eventCycle.length];
  }

  function makeEventNode(kind, floor) {
    const data = {
      treasure: {
        title: 'Baú da Forja',
        desc: 'Escolha um poder para alterar o rumo da run.'
      },
      shop: {
        title: 'Mercador de Runas',
        desc: 'Troque moedas por poder, cura ou defesa.'
      },
      camp: {
        title: 'Acampamento Seguro',
        desc: 'Recupere forças antes da próxima sequência de casas.'
      }
    }[kind] || { title: 'Evento', desc: 'Um acontecimento muda a run.' };

    return {
      id: `node-${floor}`,
      floor: floor,
      kind: kind,
      title: data.title,
      desc: data.desc,
      completed: false
    };
  }

  function buildNodes(stages, questionCount, settings) {
    const nodes = [];
    let floor = 1;
    let previousType = null;

    for (let stageIndex = 0; stageIndex < questionCount; stageIndex += 1) {
      const stage = stages[stageIndex] || normalizeStage({}, stageIndex);
      const isBoss = stageIndex === questionCount - 1;

      if (isBoss) {
        nodes.push({
          id: `node-${floor}`,
          floor: floor,
          kind: 'boss',
          stageIndex: stageIndex,
          bossStep: 0,
          bossSteps: ['standard', 'multiple', 'scientific', 'quick'],
          title: String(stage.title || '').toLowerCase().includes('boss') ? stage.title : `BOSS: ${stage.title || 'Guardião Final'}`,
          desc: stage.desc,
          completed: false,
          mistakes: 0
        });
        floor += 1;
        continue;
      }

      const questionType = pickQuestionType(settings, previousType);
      previousType = questionType;

      nodes.push({
        id: `node-${floor}`,
        floor: floor,
        kind: 'battle',
        stageIndex: stageIndex,
        questionType: questionType,
        title: stage.title,
        desc: stage.desc,
        completed: false,
        mistakes: 0,
        startedAt: null
      });
      floor += 1;

      const eventKind = getEventAfterQuestion(stageIndex);
      if (eventKind && stageIndex < questionCount - 2) {
        nodes.push(makeEventNode(eventKind, floor));
        floor += 1;
      }
    }

    return nodes;
  }

  function createRun(stages, settings) {
    const safeSettings = settings || {};
    const safeStages = Array.isArray(stages) && stages.length ? stages : getDemoStages(Number(safeSettings.questionCount || 9));
    const questionCount = Number(safeSettings.questionCount || 9);
    const normalizedStages = Array.from({ length: questionCount }, function (_, index) {
      return normalizeStage(safeStages[index] || safeStages[index % safeStages.length] || {}, index);
    });
    const run = CF.State.createEmptyRun();
    const classConfig = getEffectiveClass(safeSettings);
    const classId = (CONFIG.classes && CONFIG.classes[safeSettings.classId]) ? safeSettings.classId : 'warrior';
    run.meta.subject = safeSettings.subject || 'Modo livre';
    run.meta.source = safeSettings.source || 'demo';
    run.meta.classId = classId;
    run.meta.classLabel = classConfig.label || 'Guerreiro';
    run.meta.emblemEquipped = Boolean(safeSettings.emblemEquipped);
    run.meta.modelId = safeSettings.modelId || '';
    run.meta.usedModel = safeSettings.usedModel || safeSettings.modelId || '';
    run.vouchers = questionCount <= 6 ? 1 : questionCount <= 9 ? 2 : 3;
    run.stages = normalizedStages;
    run.nodes = buildNodes(normalizedStages, questionCount, safeSettings);
    CF.State.setRun(run);
    CF.State.saveRun();
    return run;
  }

  function getDemoStages(count) {
    const bank = [
      {
        title: 'Goblin da Soma Perdida',
        desc: 'Um goblin contador bloqueia a ponte da Forja e exige lógica básica para liberar passagem.',
        standard: { question: 'Quanto é 2 + 2?', options: ['2', '3', '4', '5'], correct: 2, hint: 'Some dois pares.' },
        multiple: { question: 'Classifique as afirmações matemáticas.', statements: [{ text: '2 + 2 = 4.', is_true: true }, { text: '10 é menor que 7.', is_true: false }, { text: 'Uma soma junta quantidades.', is_true: true }], hint: 'Compare uma afirmação por vez.' },
        scientific: { context: 'Um ferreiro tem 2 barras de ferro e recebe mais 2 barras. Ele precisa calcular o total antes de acender a fornalha.', vitalInfo: ['Barras iniciais: 2', 'Barras recebidas: 2', 'Operação: soma'], question: 'Quantas barras o ferreiro tem ao todo?', options: ['2', '3', '4', '5'], correct: 2, hint: 'Some as barras iniciais com as recebidas.' },
        quick: { question: 'Resultado rápido: 5 + 3?', options: ['7', '8', '9', '10'], correct: 1, hint: 'Conte três números depois do cinco.', seconds: 20 }
      },
      {
        title: 'Espectro da Leitura',
        desc: 'Um espírito exige interpretação antes de revelar o próximo corredor.',
        standard: { question: 'Qual é a função principal de um resumo?', options: ['Aumentar o texto', 'Apresentar as ideias principais', 'Trocar o tema', 'Esconder informações'], correct: 1, hint: 'Resumo reduz sem perder o essencial.' },
        multiple: { question: 'Sobre interpretação de texto, marque V ou F.', statements: [{ text: 'Tema é o assunto geral do texto.', is_true: true }, { text: 'Resumo deve copiar todos os detalhes do texto.', is_true: false }, { text: 'Ideia principal organiza o sentido do texto.', is_true: true }], hint: 'Diferencie assunto, detalhe e ideia central.' },
        scientific: { context: 'Um aluno leu um texto sobre poluição dos rios. O texto dizia que descarte irregular de lixo prejudica animais e qualidade da água.', vitalInfo: ['Tema: poluição dos rios', 'Causa: descarte irregular de lixo', 'Consequência: prejuízo aos animais e à água'], question: 'Qual é a relação principal apresentada no texto?', options: ['Causa e consequência', 'Ordem alfabética', 'Comparação de preços', 'Descrição de personagem'], correct: 0, hint: 'Procure o que causa um efeito.' },
        quick: { question: 'Resumo deve ser:', options: ['Mais longo', 'Essencial', 'Aleatório', 'Sem tema'], correct: 1, hint: 'Resumo conserva o principal.', seconds: 18 }
      },
      {
        title: 'Cavaleiro da Hipótese',
        desc: 'Um cavaleiro experimental só aceita respostas com causa, teste e evidência.',
        standard: { question: 'Em ciências, uma hipótese é:', options: ['Uma pergunta sem resposta', 'Uma explicação provisória testável', 'Um resultado final garantido', 'Uma opinião sem teste'], correct: 1, hint: 'Ela precisa poder ser testada.' },
        multiple: { question: 'Classifique as frases científicas.', statements: [{ text: 'Toda hipótese científica deve ser testável.', is_true: true }, { text: 'Experimento serve para testar ideias.', is_true: true }, { text: 'Evidência é apenas opinião pessoal.', is_true: false }], hint: 'Ciência depende de teste e evidência.' },
        scientific: { context: 'Uma planta recebeu luz por 8 horas ao dia e outra ficou no escuro. Após uma semana, a planta iluminada cresceu mais.', vitalInfo: ['Variável observada: luz', 'Tempo: uma semana', 'Resultado: planta iluminada cresceu mais'], question: 'Qual conclusão é mais adequada?', options: ['A luz pode influenciar o crescimento', 'Escuro sempre aumenta crescimento', 'A água não importa nunca', 'A planta escolheu crescer'], correct: 0, hint: 'Relacione a variável ao resultado observado.' },
        quick: { question: 'Hipótese precisa ser:', options: ['Testável', 'Secreta', 'Decorativa', 'Impossível'], correct: 0, hint: 'Sem teste, não há verificação.', seconds: 18 }
      },
      {
        title: 'Ladino dos Mapas',
        desc: 'Um ladrão cartográfico mistura coordenadas e escalas para confundir aventureiros.',
        standard: { question: 'Para que serve uma escala em um mapa?', options: ['Mostrar relação entre distância real e distância no mapa', 'Mudar a cor do oceano', 'Apagar legendas', 'Indicar apenas clima'], correct: 0, hint: 'Escala compara mapa e mundo real.' },
        multiple: { question: 'Sobre mapas, marque V ou F.', statements: [{ text: 'Legenda explica símbolos do mapa.', is_true: true }, { text: 'Escala não tem relação com distância.', is_true: false }, { text: 'Orientação ajuda a localizar direções.', is_true: true }], hint: 'Pense nas ferramentas de leitura de mapas.' },
        scientific: { context: 'Em um mapa, 1 cm representa 10 km. Dois pontos estão separados por 3 cm no papel.', vitalInfo: ['Escala: 1 cm = 10 km', 'Distância no mapa: 3 cm', 'Conta: 3 x 10'], question: 'Qual é a distância real entre os pontos?', options: ['3 km', '10 km', '30 km', '300 km'], correct: 2, hint: 'Multiplique a distância do mapa pela escala.' },
        quick: { question: 'Legenda serve para:', options: ['Explicar símbolos', 'Aumentar chuva', 'Criar relevo', 'Apagar escala'], correct: 0, hint: 'Símbolos precisam ser entendidos.', seconds: 20 }
      }
    ];

    return Array.from({ length: count }, function (_, index) {
      return JSON.parse(JSON.stringify(bank[index % bank.length]));
    });
  }

  function findNextIncompleteQuestion(startIndex) {
    const nodes = CF.State.getRun().nodes;
    for (let index = startIndex; index < nodes.length; index += 1) {
      if (!nodes[index].completed && (nodes[index].kind === 'battle')) return { node: nodes[index], index: index };
    }
    return null;
  }

  function applyMasterChefFrom(nodeIndex, previousType) {
    if (!CF.State.hasPower('master_chef')) return '';
    const next = findNextIncompleteQuestion(nodeIndex + 1);
    if (!next || next.node.questionType !== previousType) return '';
    const classConfig = CF.State.getClassConfig();
    const weights = Object.assign({}, classConfig.weights);
    weights[previousType] = 0;
    const newType = Utils.weightedPick(weights);
    next.node.questionType = newType;
    return `Mestre Cuca alterou a próxima questão para ${questionTypeConfig(newType).short}.`;
  }

  function autoCompleteNextQuestion(reason) {
    const run = CF.State.getRun();
    const next = findNextIncompleteQuestion(run.currentNodeIndex + 1);
    if (!next) return '';
    const reward = CF.Loot.getRewardValue(next.node);
    next.node.completed = true;
    run.stats.roomsCleared += 1;
    run.stats.battlesWon += 1;
    run.stats.xp += 8;
    run.coins += reward;
    run.stats.coinsEarned += reward;
    run.currentNodeIndex = Math.min(next.index + 1, run.nodes.length - 1);
    return `${reason} A casa ${next.node.floor} foi concluída automaticamente e rendeu ${reward} moedas.`;
  }

  function completeNode(nodeIndex) {
    let effectLog = '';
    CF.State.mutate(function (run) {
      const node = run.nodes[nodeIndex];
      if (!node || node.completed) return;
      node.completed = true;
      run.currentNodeIndex = Math.min(nodeIndex + 1, run.nodes.length - 1);
      run.stats.roomsCleared += 1;
      if (node.kind === 'battle' || node.kind === 'boss') {
        run.stats.battlesWon += 1;
        const type = node.kind === 'boss' ? 'boss' : node.questionType;
        if (type !== 'boss') run.flags.lastQuestionType = type;
        effectLog = applyMasterChefFrom(nodeIndex, type);
      }
      if (run.flags.autoCompleteNext) {
        run.flags.autoCompleteNext = false;
        const autoMessage = autoCompleteNextQuestion('Linha na Agulha ativou!');
        effectLog = [effectLog, autoMessage].filter(Boolean).join(' ');
      }
      run.flags.lastEffectLog = effectLog;
    });
    return effectLog;
  }

  function isUnlocked(index) {
    const run = CF.State.getRun();
    if (index === 0) return true;
    return run.nodes.slice(0, index).every(function (node) { return node.completed; });
  }

  function isVisible(index) {
    const run = CF.State.getRun();
    if (run.nodes[index] && run.nodes[index].completed) return true;
    const bonus = Number(run.flags.waterVisionBonus || 0);
    return index <= run.currentNodeIndex + 1 + bonus;
  }

  function isRunComplete() {
    const nodes = CF.State.getRun().nodes;
    return nodes.length > 0 && nodes.every(function (node) { return node.completed; });
  }

  CF.Dungeon = {
    normalizeStage: normalizeStage,
    createRun: createRun,
    getDemoStages: getDemoStages,
    completeNode: completeNode,
    isUnlocked: isUnlocked,
    isVisible: isVisible,
    isRunComplete: isRunComplete,
    findNextIncompleteQuestion: findNextIncompleteQuestion,
    normalizeQuestionType: normalizeQuestionType,
    questionTypeConfig: questionTypeConfig
  };
}());
