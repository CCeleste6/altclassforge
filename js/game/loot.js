(function () {
  window.CF = window.CF || {};

  const CONFIG = CF.CONFIG;
  const Utils = CF.Utils;

  const POWER_UPS = [
    {
      id: 'lightning_attack',
      name: 'Ataque Relâmpago',
      icon: '⚡',
      tags: ['quick'],
      desc: 'Se responder uma Questão Rápida em 10s ou menos, sua próxima questão não rápida terá 1 alternativa a menos.'
    },
    {
      id: 'chronometer',
      name: 'Cronômetro',
      icon: '⏱️',
      tags: ['quick'],
      max: CONFIG.maxChronometers,
      desc: 'Questões Rápidas ganham +10s por Cronômetro. Máximo: 3.'
    },
    {
      id: 'sift',
      name: 'Habilidade: Cernir',
      icon: '🧪',
      tags: ['scientific'],
      desc: 'Em Questões Científicas, as informações vitais aparecem separadas no final do enunciado.'
    },
    {
      id: 'water_vision',
      name: 'Habilidade: Visão de Água',
      icon: '💧',
      tags: ['scientific'],
      desc: 'Após completar uma Questão Científica, revela uma casa adicional à frente no mapa.'
    },
    {
      id: 'two_arrows',
      name: 'Duas Flechas, Um Coelho',
      icon: '🏹',
      tags: ['multiple'],
      desc: 'Ao completar uma Questão Múltipla, recebe um eco de recompensa da próxima casa de questão.'
    },
    {
      id: 'needle_thread',
      name: 'Linha na Agulha',
      icon: '🪡',
      tags: ['multiple'],
      desc: 'Ao completar uma Questão Múltipla sem erros, tem 10% de chance de completar automaticamente a próxima casa de questão.'
    },
    {
      id: 'master_chef',
      name: 'Mestre Cuca',
      icon: '🍳',
      tags: ['general'],
      desc: 'A próxima questão não pode ser do mesmo tipo da questão anterior.'
    },
    {
      id: 'spoils',
      name: 'Despojos',
      icon: '💰',
      tags: ['gold'],
      desc: 'Você recebe o dobro de moedas. Se for Ladino ou Grão-Mestre, recebe o triplo.'
    },
    {
      id: 'shield',
      name: 'Escudo Rúnico',
      icon: '🛡️',
      tags: ['general'],
      desc: 'Ganha 1 escudo que bloqueia o próximo erro.'
    },
    {
      id: 'heal',
      name: 'Poção de Revisão',
      icon: '🧪',
      tags: ['general'],
      desc: 'Recupera 25 HP imediatamente.'
    },
    {
      id: 'oracle',
      name: 'Voucher do Oráculo',
      icon: '🎫',
      tags: ['general'],
      desc: 'Ganha 1 voucher de dica.'
    },
    {
      id: 'focus',
      name: 'Foco do Aprendiz',
      icon: '📘',
      tags: ['general'],
      desc: 'Reduz o dano por erro em 3 HP enquanto estiver ativo.'
    }
  ];

  function getPowerUp(id) {
    return POWER_UPS.find(function (power) { return power.id === id; }) || POWER_UPS[0];
  }

  function canReceive(power) {
    if (!power) return false;
    if (power.max && CF.State.getPowerLevel(power.id) >= power.max) return false;
    return true;
  }

  function weightedPool() {
    const classConfig = CF.State.getClassConfig();
    const preferred = classConfig.preferredTags || [];
    const pool = [];
    POWER_UPS.forEach(function (power) {
      if (!canReceive(power)) return;
      const tags = power.tags || [];
      const hasPreferredTag = tags.some(function (tag) { return preferred.includes(tag); });
      const copies = hasPreferredTag ? 4 : tags.includes('general') ? 2 : 1;
      for (let i = 0; i < copies; i += 1) pool.push(power);
    });
    return pool.length ? pool : POWER_UPS.filter(canReceive);
  }

  function randomChoices(count) {
    const pool = weightedPool();
    const ids = [];
    const result = [];
    let safety = 0;
    while (result.length < count && safety < 80) {
      safety += 1;
      const power = Utils.pick(pool);
      if (!power || ids.includes(power.id)) continue;
      ids.push(power.id);
      result.push(power);
    }
    return result;
  }

  function grantPowerUp(id) {
    const power = getPowerUp(id);
    if (!canReceive(power)) {
      alert(`${power.name} já atingiu o limite.`);
      return false;
    }

    CF.State.mutate(function (run) {
      if (id === 'heal') {
        run.hp = Math.min(run.maxHp, run.hp + 25);
      } else if (id === 'shield') {
        run.shield += 1;
      } else if (id === 'oracle') {
        run.vouchers += 1;
      } else {
        run.powerUps.push(Object.assign({}, power));
        if (id === 'master_chef') run.flags.masterChefActive = true;
      }
    });
    CF.Screens.syncHUD();
    CF.Screens.updateDashboard && CF.Screens.updateDashboard();
    return true;
  }

  function getWrongDamage() {
    const focus = CF.State.getPowerLevel('focus');
    return Math.max(5, CONFIG.baseWrongDamage - focus * 3);
  }

  function getQuickSeconds(stage) {
    const base = Number(stage && stage.quick && stage.quick.seconds ? stage.quick.seconds : CONFIG.quickBaseSeconds);
    const bonus = Math.min(CF.State.getPowerLevel('chronometer'), CONFIG.maxChronometers) * 10;
    return base + bonus;
  }

  function getRewardMultiplier() {
    const run = CF.State.getRun();
    let multiplier = 1;
    if (CF.State.hasPower('spoils')) {
      multiplier *= (run.meta.classId === 'rogue' || run.meta.emblemEquipped) ? 3 : 2;
    }
    if (run.meta.emblemEquipped) multiplier *= 2;
    return multiplier;
  }

  function getRewardValue(node) {
    if (!node) return 0;
    if (node.kind === 'boss') return CONFIG.baseRewards.boss * getRewardMultiplier();
    if (node.kind !== 'battle') return 0;
    const type = CF.Dungeon && CF.Dungeon.normalizeQuestionType ? CF.Dungeon.normalizeQuestionType(node.questionType) : (node.questionType || 'standard');
    const base = CONFIG.baseRewards[type] || 10;
    return Math.round(base * getRewardMultiplier());
  }

  function getVisibleOptions(stage, questionType, node) {
    const safeStage = stage || {};
    const source = questionType === 'scientific' ? (safeStage.scientific || {}) : questionType === 'quick' ? (safeStage.quick || {}) : (safeStage.standard || {});
    const options = (source.options || []).map(function (text, index) {
      return { text: text, originalIndex: index };
    });

    if (!node || questionType === 'quick' || !CF.State.getRun().flags.lightningReady) return options;
    if (node.lightningApplied) return options.filter(function (option) { return option.originalIndex !== node.hiddenByLightning; });

    const correct = Number(source.correct);
    const wrongIndexes = options.map(function (option) { return option.originalIndex; }).filter(function (index) { return index !== correct; });
    const hidden = Utils.pick(wrongIndexes);
    node.hiddenByLightning = hidden;
    node.lightningApplied = true;
    CF.State.mutate(function (run) {
      run.flags.lightningReady = false;
      run.flags.lightningAppliedToNode = node.id;
      run.flags.lastEffectLog = 'Ataque Relâmpago removeu uma alternativa incorreta.';
    });
    return options.filter(function (option) { return option.originalIndex !== hidden; });
  }

  function getStealthRequiredMatches(total) {
    if (!total) return 1;
    return Math.ceil(total / 2);
  }

  function resolveTypeEffects(node, elapsedSeconds) {
    const messages = [];
    const run = CF.State.getRun();
    const type = node.kind === 'boss' ? ((node.bossSteps || [])[node.bossStep] || 'standard') : (node.questionType || 'standard');

    if (type === 'quick' && CF.State.hasPower('lightning_attack') && elapsedSeconds <= CONFIG.quickPerfectSeconds) {
      run.flags.lightningReady = true;
      messages.push('Ataque Relâmpago carregado: a próxima questão não rápida terá uma alternativa a menos.');
    }

    if (type === 'scientific' && CF.State.hasPower('water_vision')) {
      run.flags.waterVisionBonus = Math.max(run.flags.waterVisionBonus || 0, 1);
      messages.push('Visão de Água revelou uma casa adicional à frente.');
    }

    if (type === 'multiple' && CF.State.hasPower('two_arrows')) {
      const next = CF.Dungeon.findNextIncompleteQuestion(CF.Modal.getCurrentNodeIndex() + 1);
      if (next) {
        const echoReward = Math.max(1, Math.floor(getRewardValue(next.node) / 2));
        run.coins += echoReward;
        run.stats.coinsEarned += echoReward;
        messages.push(`Duas Flechas, Um Coelho concedeu ${echoReward} moedas extras.`);
      }
    }

    if (type === 'multiple' && CF.State.hasPower('needle_thread') && Number(node.mistakes || 0) === 0) {
      if (Math.random() < 0.1) {
        run.flags.autoCompleteNext = true;
        messages.push('Linha na Agulha acertou o ponto fraco: próxima questão será concluída automaticamente.');
      } else {
        messages.push('Linha na Agulha tentou ativar, mas falhou desta vez.');
      }
    }

    return messages.join(' ');
  }

  CF.Loot = {
    all: POWER_UPS,
    getPowerUp: getPowerUp,
    randomChoices: randomChoices,
    grantPowerUp: grantPowerUp,
    getWrongDamage: getWrongDamage,
    getQuickSeconds: getQuickSeconds,
    getRewardValue: getRewardValue,
    getVisibleOptions: getVisibleOptions,
    getStealthRequiredMatches: getStealthRequiredMatches,
    resolveTypeEffects: resolveTypeEffects,
    getRewardMultiplier: getRewardMultiplier
  };
}());
