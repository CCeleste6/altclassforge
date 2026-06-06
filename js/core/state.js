(function () {
  window.CF = window.CF || {};

  const CONFIG = CF.CONFIG;
  const Utils = CF.Utils;

  function emptyTypeStats() {
    return {
      standard: { attempts: 0, correct: 0 },
      multiple: { attempts: 0, correct: 0 },
      scientific: { attempts: 0, correct: 0 },
      quick: { attempts: 0, correct: 0 }
    };
  }

  function emptyStats() {
    return {
      attempts: 0,
      correct: 0,
      wrong: 0,
      xp: 0,
      roomsCleared: 0,
      battlesWon: 0,
      coinsEarned: 0,
      byType: emptyTypeStats()
    };
  }

  function createEmptyRun() {
    return {
      meta: {
        version: CONFIG.version,
        createdAt: new Date().toISOString(),
        subject: '',
        source: 'demo',
        classId: 'warrior',
        classLabel: 'Guerreiro',
        emblemEquipped: false,
        modelId: '',
        usedModel: ''
      },
      hp: 100,
      maxHp: 100,
      coins: 0,
      vouchers: 0,
      shield: 0,
      currentNodeIndex: 0,
      stages: [],
      nodes: [],
      powerUps: [],
      flags: {
        lightningReady: false,
        lightningAppliedToNode: null,
        waterVisionBonus: 0,
        autoCompleteNext: false,
        masterChefActive: false,
        lastQuestionType: null,
        lastEffectLog: ''
      },
      stats: emptyStats()
    };
  }

  let run = createEmptyRun();

  function safeClassConfig(classId, emblemEquipped) {
    const classes = CONFIG.classes || {};
    if (emblemEquipped && CONFIG.grandmaster) return CONFIG.grandmaster;
    return classes[classId] || classes.warrior || {
      label: 'Guerreiro',
      icon: '🛡️',
      desc: 'Aventura equilibrada.',
      weights: { standard: 40, multiple: 20, scientific: 20, quick: 20 },
      preferredTags: []
    };
  }

  function normalizeRun(nextRun) {
    const base = createEmptyRun();
    const input = nextRun || {};
    const normalized = Object.assign({}, base, input);
    normalized.meta = Object.assign({}, base.meta, input.meta || {});
    normalized.flags = Object.assign({}, base.flags, input.flags || {});
    normalized.stats = Object.assign({}, emptyStats(), input.stats || {});
    normalized.stats.byType = Object.assign({}, emptyTypeStats(), normalized.stats.byType || {});
    Object.keys(emptyTypeStats()).forEach(function (key) {
      normalized.stats.byType[key] = Object.assign({ attempts: 0, correct: 0 }, normalized.stats.byType[key] || {});
    });

    if (!Array.isArray(normalized.nodes)) normalized.nodes = [];
    if (!Array.isArray(normalized.stages)) normalized.stages = [];
    if (!Array.isArray(normalized.powerUps)) normalized.powerUps = [];

    const classConfig = safeClassConfig(normalized.meta.classId, normalized.meta.emblemEquipped);
    normalized.meta.classId = (CONFIG.classes && CONFIG.classes[normalized.meta.classId]) ? normalized.meta.classId : 'warrior';
    normalized.meta.classLabel = normalized.meta.emblemEquipped ? (CONFIG.grandmaster && CONFIG.grandmaster.label) || 'Grão-Mestre' : classConfig.label;
    normalized.meta.version = CONFIG.version;

    normalized.hp = Number.isFinite(Number(normalized.hp)) ? Number(normalized.hp) : base.hp;
    normalized.maxHp = Number.isFinite(Number(normalized.maxHp)) ? Number(normalized.maxHp) : base.maxHp;
    normalized.coins = Number.isFinite(Number(normalized.coins)) ? Number(normalized.coins) : 0;
    normalized.vouchers = Number.isFinite(Number(normalized.vouchers)) ? Number(normalized.vouchers) : 0;
    normalized.shield = Number.isFinite(Number(normalized.shield)) ? Number(normalized.shield) : 0;
    normalized.currentNodeIndex = Number.isFinite(Number(normalized.currentNodeIndex)) ? Number(normalized.currentNodeIndex) : 0;

    return normalized;
  }

  function getRun() {
    return run;
  }

  function setRun(nextRun) {
    run = normalizeRun(nextRun);
    return run;
  }

  function resetRun() {
    run = createEmptyRun();
    localStorage.removeItem(CONFIG.saveKey);
    return run;
  }

  function clearLegacySaves() {
    (CONFIG.legacySaveKeys || []).forEach(function (key) {
      if (key && key !== CONFIG.saveKey) localStorage.removeItem(key);
    });
  }

  function saveRun() {
    try {
      localStorage.setItem(CONFIG.saveKey, JSON.stringify(run));
    } catch (error) {
      console.warn('Não foi possível salvar a run:', error);
    }
  }

  function loadRun() {
    clearLegacySaves();
    const saved = localStorage.getItem(CONFIG.saveKey);
    if (!saved) return null;
    const parsed = Utils.safeJsonParse(saved, null);
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.stages)) {
      localStorage.removeItem(CONFIG.saveKey);
      return null;
    }
    setRun(parsed);
    return run;
  }

  function mutate(callback, shouldSave) {
    callback(run);
    if (shouldSave !== false) saveRun();
    return run;
  }

  function getPowerLevel(id) {
    return run.powerUps.filter(function (power) { return power && power.id === id; }).length;
  }

  function hasPower(id) {
    return getPowerLevel(id) > 0;
  }

  function getClassConfig() {
    return safeClassConfig(run.meta.classId, run.meta.emblemEquipped);
  }

  CF.State = {
    createEmptyRun: createEmptyRun,
    getRun: getRun,
    setRun: setRun,
    resetRun: resetRun,
    clearLegacySaves: clearLegacySaves,
    saveRun: saveRun,
    loadRun: loadRun,
    mutate: mutate,
    getPowerLevel: getPowerLevel,
    hasPower: hasPower,
    getClassConfig: getClassConfig
  };
}());
