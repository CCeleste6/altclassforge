(function () {
  window.CF = window.CF || {};

  const Utils = CF.Utils;
  const CONFIG = CF.CONFIG;

  function qs(id) {
    return document.getElementById(id);
  }

  function addClass(id, className) {
    const el = qs(id);
    if (el) el.classList.add(className);
  }

  function removeClass(id, className) {
    const el = qs(id);
    if (el) el.classList.remove(className);
  }

  function toggleClass(id, className, force) {
    const el = qs(id);
    if (el) el.classList.toggle(className, force);
  }

  function setText(id, value) {
    const el = qs(id);
    if (el) el.textContent = value;
  }

  function showConfig() {
    addClass('config-screen', 'screen-visible');
    removeClass('game-area', 'visible');
    removeClass('game-hud', 'visible');
  }

  function showGame() {
    removeClass('config-screen', 'screen-visible');
    addClass('game-area', 'visible');
    addClass('game-hud', 'visible');
    syncHUD();
  }

  function showLoading(isLoading) {
    toggleClass('config-box', 'hidden', isLoading);
    toggleClass('loading', 'hidden', !isLoading);
  }

  function showDashboard() {
    updateDashboard();
    addClass('dashboard', 'visible');
  }

  function hideDashboard() {
    removeClass('dashboard', 'visible');
  }

  function syncHUD() {
    const run = CF.State.getRun();
    const hpPercent = run.maxHp ? (run.hp / run.maxHp) * 100 : 0;
    const hpBar = qs('hp-bar');
    if (hpBar) hpBar.style.width = `${Utils.clamp(hpPercent, 0, 100)}%`;
    setText('hp-text', `${run.hp}/${run.maxHp}`);
    setText('class-label', run.meta.emblemEquipped ? 'Grão-Mestre' : (run.meta.classLabel || 'Guerreiro'));
    setText('coin-count', run.coins || 0);
    setText('voucher-count', run.vouchers || 0);
    setText('shield-count', run.shield || 0);
  }

  function questionTypeStatsHTML(run) {
    return Object.keys(CONFIG.questionTypes || {}).map(function (type) {
      const typeConfig = CONFIG.questionTypes[type] || { icon: '⚔️', short: type };
      const stats = run.stats.byType[type] || { attempts: 0, correct: 0 };
      return `<span class="profile-chip">${typeConfig.icon} ${Utils.escapeHTML(typeConfig.short)}: ${stats.correct}/${stats.attempts}</span>`;
    }).join('');
  }

  function updateDashboard() {
    const run = CF.State.getRun();
    setText('dash-precision', Utils.toPercent(run.stats.correct, run.stats.attempts));
    setText('dash-xp', run.stats.xp || 0);
    setText('dash-wins', run.stats.roomsCleared || 0);
    setText('dash-coins', run.coins || 0);

    const profile = qs('run-profile');
    if (profile) {
      const className = run.meta.emblemEquipped ? ((CONFIG.grandmaster && CONFIG.grandmaster.label) || 'Grão-Mestre') : (run.meta.classLabel || 'Guerreiro');
      profile.innerHTML = `
        <div><strong>Classe:</strong> ${Utils.escapeHTML(className)} · <strong>Origem:</strong> ${Utils.escapeHTML(run.meta.source || 'demo')}</div>
        <div><strong>Matéria:</strong> ${Utils.escapeHTML(run.meta.subject || 'Modo livre')}</div>
        <div class="profile-chip-row">${questionTypeStatsHTML(run)}</div>
      `;
    }

    const list = qs('powerup-list');
    if (!list) return;
    if (!run.powerUps.length) {
      list.className = 'powerup-list empty-state';
      list.textContent = 'Nenhum power-up ainda.';
      return;
    }

    const grouped = run.powerUps.reduce(function (acc, power) {
      if (!power || !power.id) return acc;
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
