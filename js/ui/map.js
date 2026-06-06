(function () {
  window.CF = window.CF || {};

  const Utils = CF.Utils;

  const ICONS = {
    battle: { quiz: '⚔️', magic: '✨', stealth: '🧩' },
    boss: '🐲',
    treasure: '🎁',
    shop: '🛒',
    camp: '⛺'
  };

  function getCardIcon(node) {
    if (node.completed) return '🛡️';
    if (node.kind === 'battle') return ICONS.battle[node.mode] || '⚔️';
    return ICONS[node.kind] || '⬡';
  }

  function getTypeLabel(node) {
    if (node.kind === 'battle') {
      return { quiz: 'Combate: Quiz', magic: 'Magia: V/F', stealth: 'Furtivo: Aberta' }[node.mode] || 'Questão';
    }
    if (node.kind === 'boss') return 'Boss Multifase';
    if (node.kind === 'treasure') return 'Tesouro';
    if (node.kind === 'shop') return 'Loja';
    if (node.kind === 'camp') return 'Descanso';
    return 'Casa';
  }

  function render() {
    const run = CF.State.getRun();
    const container = document.getElementById('map-container');
    container.innerHTML = '';

    run.nodes.forEach(function (node, index) {
      if (index > 0) {
        const connector = document.createElement('div');
        connector.className = 'connector';
        container.appendChild(connector);
      }

      const isLocked = !CF.Dungeon.isUnlocked(index);
      const card = document.createElement('article');
      card.className = `card ${node.kind} ${node.completed ? 'cleared' : ''} ${isLocked ? 'locked' : ''} ${index === run.currentNodeIndex ? 'current' : ''}`;
      card.innerHTML = `
        <div class="card-floor">Casa ${node.floor} · ${Utils.escapeHTML(getTypeLabel(node))}</div>
        <div class="card-icon">${getCardIcon(node)}</div>
        <div class="card-title">${Utils.escapeHTML(node.title)}</div>
        <div class="card-desc">${Utils.escapeHTML(node.desc || '')}</div>
        <div class="card-reward">${node.kind === 'battle' || node.kind === 'boss' ? `+${CF.Loot.getRewardValue(node)} moedas` : 'Evento da run'}</div>
      `;

      card.addEventListener('click', function () {
        if (isLocked || node.completed) return;
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
