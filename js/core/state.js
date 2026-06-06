(function () {
  window.CF = window.CF || {};

  const CONFIG = CF.CONFIG;
  const Utils = CF.Utils;

  function emptyStats() {
    return {
      attempts: 0,
      correct: 0,
      wrong: 0,
      xp: 0,
      roomsCleared: 0,
      battlesWon: 0,
      coinsEarned: 0,
      byType: {
        standard: { attempts: 0, correct: 0 },
        multiple: { attempts: 0, correct: 0 },
        scientific: { attempts: 0, correct: 0 },
        quick: { attempts: 0, correct: 0 }
      }
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
        emblemEquipped: false
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

  function normalizeRun(nextRun) {
    const base = createEmptyRun();
    const normalized = Object.assign(base, nextRun || {});
    normalized.meta = Object.assign(base.meta, normalized.meta || {});
    normalized.flags = Object.assign(base.flags, normalized.flags || {});
    normalized.stats = Object.assign(emptyStats(), normalized.stats || {});
    normalized.stats.byType = Object.assign(emptyStats().byType, normalized.stats.byType || {});
    Object.keys(emptyStats().byType).forEach(function (key) {
      normalized.stats.byType[key] = Object.assign({ attempts: 0, correct: 0 }, normalized.stats.byType[key] || {});
    });
    if (!Array.isArray(normalized.nodes)) normalized.nodes = [];
    if (!Array.isArray(normalized.stages)) normalized.stages = [];
    if (!Array.isArray(normalized.powerUps)) normalized.powerUps = [];
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

  function saveRun() {
    localStorage.setItem(CONFIG.saveKey, JSON.stringify(run));
  }

  function loadRun() {
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
    return run.powerUps.filter(function (power) { return power.id === id; }).length;
  }

  function hasPower(id) {
    return getPowerLevel(id) > 0;
  }

  function getClassConfig() {
    if (run.meta.emblemEquipped) return CONFIG.grandmaster;
    return CONFIG.classes[run.meta.classId] || CONFIG.classes.warrior;
  }

  CF.State = {
    createEmptyRun: createEmptyRun,
    getRun: getRun,
    setRun: setRun,
    resetRun: resetRun,
    saveRun: saveRun,
    loadRun: loadRun,
    mutate: mutate,
    getPowerLevel: getPowerLevel,
    hasPower: hasPower,
    getClassConfig: getClassConfig
  };
}());
