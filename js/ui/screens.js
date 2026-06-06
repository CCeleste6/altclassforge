(function () {
  window.CF = window.CF || {};

  const Utils = CF.Utils;
  const CONFIG = CF.CONFIG;

  function qs(id) {
    return document.getElementById(id);
  }

  function showConfig() {
    qs('config-screen').classList.add('screen-visible');
    qs('game-area').classList.remove('visible');
    qs('game-hud').classList.remove('visible');
  }

  function showGame() {
    qs('config-screen').classList.remove('screen-visible');
    qs('game-area').classList.add('visible');
    qs('game-hud').classList.add('visible');
    syncHUD();
  }

  function showLoading(isLoading) {
    qs('config-box').classList.toggle('hidden', isLoading);
    qs('loading').classList.toggle('hidden', !isLoading);
  }

  function showDashboard() {
    updateDashboard();
    qs('dashboard').classList.add('visible');
  }

  function hideDashboard() {
    qs('dashboard').classList.remove('visible');
  }

  function syncHUD() {
    const run = CF.State.getRun();
    const hpPercent = run.maxHp ? (run.hp / run.maxHp) * 100 : 0;
    qs('hp-bar').style.width = `${Utils.clamp(hpPercent, 0, 100)}%`;
    qs('hp-text').textContent = `${run.hp}/${run.maxHp}`;
    qs('class-label').textContent = run.meta.emblemEquipped ? 'Grão-Mestre' : run.meta.classLabel;
    qs('coin-count').textContent = run.coins;
    qs('voucher-count').textContent = run.vouchers;
    qs('shield-count').textContent = run.shield;
  }

  function updateDashboard() {
    const run = CF.State.getRun();
    qs('dash-precision').textContent = Utils.toPercent(run.stats.correct, run.stats.attempts);
    qs('dash-xp').textContent = run.stats.xp;
    qs('dash-wins').textContent = run.stats.roomsCleared;
    qs('dash-coins').textContent = run.coins;

    const profile = qs('run-profile');
    const className = run.meta.emblemEquipped ? CONFIG.grandmaster.label : run.meta.classLabel;
    const typeLines = Object.keys(CONFIG.questionTypes).map(function (type) {
      const stats = run.stats.byType[type] || { attempts: 0, correct: 0 };
      return `<span class="profile-chip">${CONFIG.questionTypes[type].icon} ${CONFIG.questionTypes[type].short}: ${stats.correct}/${stats.attempts}</span>`;
    }).join('');
    profile.innerHTML = `
      <div><strong>Classe:</strong> ${Utils.escapeHTML(className)} · <strong>Origem:</strong> ${Utils.escapeHTML(run.meta.source)}</div>
      <div><strong>Matéria:</strong> ${Utils.escapeHTML(run.meta.subject || 'Modo livre')}</div>
      <div class="profile-chip-row">${typeLines}</div>
    `;

    const list = qs('powerup-list');
    if (!run.powerUps.length) {
      list.className = 'powerup-list empty-state';
      list.textContent = 'Nenhum power-up ainda.';
      return;
    }

    const grouped = run.powerUps.reduce(function (acc, power) {
      acc[power.id] = acc[power.id] || Object.assign({}, power, { count: 0 });
      acc[power.id].count += 1;
      return acc;
    }, {});

    list.className = 'powerup-list';
    list.innerHTML = Object.values(grouped).map(function (power) {
      const count = power.count > 1 ? ` x${power.count}` : '';
      return `<span class="powerup-chip" title="${Utils.escapeHTML(power.desc)}">${power.icon} ${Utils.escapeHTML(power.name)}${count}</span>`;
    }).join('');
  }

  function restart() {
    if (!confirm('Reiniciar a run atual?')) return;
    CF.State.resetRun();
    location.reload();
  }

  CF.Screens = {
    qs: qs,
    showConfig: showConfig,
    showGame: showGame,
    showLoading: showLoading,
    showDashboard: showDashboard,
    hideDashboard: hideDashboard,
    syncHUD: syncHUD,
    updateDashboard: updateDashboard,
    restart: restart
  };
}());
