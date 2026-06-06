(function () {
  window.CF = window.CF || {};

  const Utils = CF.Utils;
  const CONFIG = CF.CONFIG;

  const ICONS = {
    boss: '🐲',
    treasure: '🎁',
    shop: '🛒',
    camp: '⛺',
    hidden: '❔'
  };

  function getQuestionConfig(node) {
    const type = node && node.questionType ? node.questionType : 'standard';
    if (CF.Dungeon && CF.Dungeon.questionTypeConfig) return CF.Dungeon.questionTypeConfig(type);
    return (CONFIG.questionTypes && CONFIG.questionTypes[type]) || (CONFIG.questionTypes && CONFIG.questionTypes.standard) || {
      label: 'Questão Padrão',
      short: 'Padrão',
      icon: '⚔️'
    };
  }

  function getCardIcon(node, isVisible) {
    if (!isVisible) return ICONS.hidden;
    if (node.completed) return '🛡️';
    if (node.kind === 'battle') return getQuestionConfig(node).icon;
    if (node.kind === 'boss') return ICONS.boss;
    return ICONS[node.kind] || '⬡';
  }

  function getTypeLabel(node, isVisible) {
    if (!isVisible) return 'Casa desconhecida';
    if (node.kind === 'battle') return getQuestionConfig(node).label;
    if (node.kind === 'boss') return 'Boss Multiforme';
    if (node.kind === 'treasure') return 'Tesouro';
    if (node.kind === 'shop') return 'Loja';
    if (node.kind === 'camp') return 'Descanso';
    return 'Casa';
  }

  function getRewardText(node, isVisible) {
    if (!isVisible) return 'Ainda oculto';
    if (node.kind === 'battle' || node.kind === 'boss') return `+${CF.Loot.getRewardValue(node)} moedas`;
    return 'Evento da run';
  }

  function render() {
    const run = CF.State.getRun();
    const container = document.getElementById('map-container');
    if (!container) return;
    container.innerHTML = '';

    (run.nodes || []).forEach(function (node, index) {
      if (!node) return;
      if (index > 0) {
        const connector = document.createElement('div');
        connector.className = 'connector';
        container.appendChild(connector);
      }

      const isLocked = !CF.Dungeon.isUnlocked(index);
      const visible = CF.Dungeon.isVisible(index);
      const card = document.createElement('article');
      card.className = `card ${node.kind} ${node.completed ? 'cleared' : ''} ${isLocked ? 'locked' : ''} ${!visible ? 'obscured' : ''} ${index === run.currentNodeIndex ? 'current' : ''}`;
      card.innerHTML = `
        <div class="card-floor">Casa ${node.floor || index + 1} · ${Utils.escapeHTML(getTypeLabel(node, visible))}</div>
        <div class="card-icon">${getCardIcon(node, visible)}</div>
        <div class="card-title">${Utils.escapeHTML(visible ? node.title : '???')}</div>
        <div class="card-desc">${Utils.escapeHTML(visible ? (node.desc || '') : 'Complete casas ou use Visão de Água para revelar mais adiante.')}</div>
        <div class="card-reward">${getRewardText(node, visible)}</div>
      `;

      card.addEventListener('click', function () {
        if (isLocked || node.completed || !visible) return;
        CF.Audio.playSound('click');
        CF.Modal.openNode(index);
      });

      container.appendChild(card);
    });
  }

  CF.Map = {
    render: render
  };
}());
