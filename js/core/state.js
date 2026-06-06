(function () {
  window.CF = window.CF || {};

  const CONFIG = CF.CONFIG;
  const Utils = CF.Utils;

  function createEmptyRun() {
    return {
      meta: {
        version: CONFIG.version,
        createdAt: new Date().toISOString(),
        subject: '',
        theme: '',
        source: 'demo'
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
      stats: {
        attempts: 0,
        correct: 0,
        wrong: 0,
        xp: 0,
        roomsCleared: 0,
        battlesWon: 0,
        coinsEarned: 0
      }
    };
  }

  let run = createEmptyRun();

  function getRun() {
    return run;
  }

  function setRun(nextRun) {
    run = Object.assign(createEmptyRun(), nextRun || {});
    run.stats = Object.assign(createEmptyRun().stats, run.stats || {});
    run.meta = Object.assign(createEmptyRun().meta, run.meta || {});
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
    if (!parsed || !Array.isArray(parsed.nodes)) {
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

  CF.State = {
    createEmptyRun: createEmptyRun,
    getRun: getRun,
    setRun: setRun,
    resetRun: resetRun,
    saveRun: saveRun,
    loadRun: loadRun,
    mutate: mutate,
    getPowerLevel: getPowerLevel
  };
}());
