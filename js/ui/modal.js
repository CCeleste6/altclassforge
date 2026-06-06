(function () {
  window.CF = window.CF || {};

  const Utils = CF.Utils;
  let currentNodeIndex = -1;

  function modal() { return document.getElementById('battle-modal'); }
  function title() { return document.getElementById('modal-title'); }
  function body() { return document.getElementById('modal-body'); }

  function getCurrentNodeIndex() {
    return currentNodeIndex;
  }

  function close() {
    CF.Audio.stopBossMusic();
    document.body.classList.remove('boss-mode');
    modal().classList.remove('visible');
  }

  function openBase(label, html) {
    title().textContent = label;
    body().innerHTML = html;
    modal().classList.add('visible');
  }

  function getStage(node) {
    return CF.State.getRun().stages[node.stageIndex];
  }

  function feedbackHTML() {
    return '<div id="feedback-area" class="feedback-area"></div>';
  }

  function showFeedback(message, isGood) {
    const area = document.getElementById('feedback-area');
    if (!area) return;
    area.textContent = message;
    area.className = `feedback-area ${isGood ? 'correct' : 'wrong'}`;
  }

  function hintButton(hint) {
    return `<button class="menu-btn" data-hint="${Utils.escapeHTML(hint)}">💡 Dica</button>`;
  }

  function bindHint(hint) {
    const button = body().querySelector('[data-hint]');
    if (button) button.addEventListener('click', function () { CF.Combat.useHint(hint, button); });
  }

  function renderQuestion(mode) {
    const run = CF.State.getRun();
    const node = run.nodes[currentNodeIndex];
    const stage = getStage(node);
    const modeLabel = { quiz: 'Quiz', magic: 'Verdadeiro/Falso', stealth: 'Resposta Aberta' }[mode];
    let html = `<div class="lore-box">${Utils.escapeHTML(node.desc || stage.desc)}</div>`;
    html += `<div class="question-meta"><span class="badge">Casa ${node.floor}</span><span class="badge">${Utils.escapeHTML(modeLabel)}</span><span class="badge">Recompensa: ${CF.Loot.getRewardValue(node)} moedas</span></div>`;
    html += feedbackHTML();

    if (mode === 'quiz') {
      html += `<p class="question-text">${Utils.escapeHTML(stage.quiz.question)}</p>`;
      stage.quiz.options.forEach(function (option, index) {
        html += `<button class="quiz-btn" data-quiz-index="${index}">${Utils.escapeHTML(option)}</button>`;
      });
      html += `<div class="action-row">${hintButton(stage.quiz.hint)}</div>`;
      openBase(node.title, html);
      body().querySelectorAll('[data-quiz-index]').forEach(function (button) {
        button.addEventListener('click', function () { CF.Combat.checkQuiz(Number(button.dataset.quizIndex), button); });
      });
      bindHint(stage.quiz.hint);
      return;
    }

    if (mode === 'magic') {
      html += `<p class="question-text">“${Utils.escapeHTML(stage.magic.statement)}”</p>`;
      html += '<button class="quiz-btn" data-magic="true">VERDADEIRO</button>';
      html += '<button class="quiz-btn" data-magic="false">FALSO</button>';
      html += `<div class="action-row">${hintButton(stage.magic.hint)}</div>`;
      openBase(node.title, html);
      body().querySelectorAll('[data-magic]').forEach(function (button) {
        button.addEventListener('click', function () { CF.Combat.checkMagic(button.dataset.magic === 'true', button); });
      });
      bindHint(stage.magic.hint);
      return;
    }

    html += `<p class="question-text">${Utils.escapeHTML(stage.stealth.question)}</p>`;
    html += '<textarea id="stealth-input" class="stealth-input" placeholder="Digite sua resposta usando os conceitos centrais..."></textarea>';
    html += '<button id="check-stealth-btn" class="btn-main">Enviar resposta</button>';
    html += `<div class="action-row">${hintButton(stage.stealth.hint)}</div>`;
    openBase(node.title, html);
    document.getElementById('check-stealth-btn').addEventListener('click', CF.Combat.checkStealth);
    bindHint(stage.stealth.hint);
  }

  function renderBossStep() {
    const run = CF.State.getRun();
    const node = run.nodes[currentNodeIndex];
    const steps = ['quiz', 'magic', 'stealth'];
    const step = steps[node.bossStep || 0];
    document.body.classList.add('boss-mode');
    renderQuestion(step);
    title().textContent = `${node.title} · Fase ${(node.bossStep || 0) + 1}/3`;
  }

  function openBattle(index) {
    currentNodeIndex = index;
    const node = CF.State.getRun().nodes[index];
    if (node.kind === 'boss') {
      CF.Audio.playSound('boss');
      CF.Audio.playBossMusic();
      renderBossStep();
      return;
    }
    renderQuestion(node.mode);
  }

  function openTreasure(index) {
    currentNodeIndex = index;
    const choices = CF.Loot.randomChoices(3);
    let html = '<div class="lore-box">O baú abre com um brilho dourado. Escolha um poder para esta run.</div>';
    choices.forEach(function (power) {
      html += `<button class="choice-btn" data-power="${power.id}"><strong>${power.icon} ${Utils.escapeHTML(power.name)}</strong><br>${Utils.escapeHTML(power.desc)}</button>`;
    });
    openBase('Baú da Forja', html);
    body().querySelectorAll('[data-power]').forEach(function (button) {
      button.addEventListener('click', function () {
        CF.Loot.grantPowerUp(button.dataset.power);
        CF.Dungeon.completeNode(index);
        CF.Map.render();
        close();
      });
    });
  }

  function openShop(index) {
    currentNodeIndex = index;
    const shopItems = [
      { id: 'heal', cost: 12 },
      { id: 'shield', cost: 14 },
      { id: 'oracle', cost: 16 },
      { id: 'focus', cost: 22 }
    ].map(function (item) { return Object.assign({}, CF.Loot.getPowerUp(item.id), { cost: item.cost }); });

    let html = `<div class="lore-box">O mercador aceita moedas de troca da run. Você tem <strong>${CF.State.getRun().coins}</strong> moedas.</div>`;
    shopItems.forEach(function (item) {
      html += `<button class="shop-btn" data-buy="${item.id}" data-cost="${item.cost}"><strong>${item.icon} ${Utils.escapeHTML(item.name)} · ${item.cost} moedas</strong><br>${Utils.escapeHTML(item.desc)}</button>`;
    });
    html += '<button class="btn-main btn-sec" data-skip-shop="true">Sair da loja</button>';
    openBase('Mercador de Runas', html);

    body().querySelectorAll('[data-buy]').forEach(function (button) {
      button.addEventListener('click', function () {
        const cost = Number(button.dataset.cost);
        const run = CF.State.getRun();
        if (run.coins < cost) {
          CF.Audio.playSound('error');
          alert('Moedas insuficientes.');
          return;
        }
        CF.State.mutate(function (state) { state.coins -= cost; });
        CF.Loot.grantPowerUp(button.dataset.buy);
        CF.Dungeon.completeNode(index);
        CF.Screens.syncHUD();
        CF.Map.render();
        close();
      });
    });

    body().querySelector('[data-skip-shop]').addEventListener('click', function () {
      CF.Dungeon.completeNode(index);
      CF.Map.render();
      close();
    });
  }

  function openCamp(index) {
    currentNodeIndex = index;
    let html = '<div class="lore-box">O fogo do acampamento restaura parte do seu HP. Respire, revise e siga em frente.</div>';
    html += '<button class="btn-main" data-rest="true">Descansar (+30 HP)</button>';
    openBase('Acampamento Seguro', html);
    body().querySelector('[data-rest]').addEventListener('click', function () {
      CF.State.mutate(function (run) {
        run.hp = Math.min(run.maxHp, run.hp + 30);
      });
      CF.Dungeon.completeNode(index);
      CF.Screens.syncHUD();
      CF.Map.render();
      close();
    });
  }

  function openRewardChoice(message) {
    const choices = CF.Loot.randomChoices(3);
    let html = `<div class="lore-box">${Utils.escapeHTML(message)}</div>`;
    choices.forEach(function (power) {
      html += `<button class="choice-btn" data-reward-power="${power.id}"><strong>${power.icon} ${Utils.escapeHTML(power.name)}</strong><br>${Utils.escapeHTML(power.desc)}</button>`;
    });
    html += '<button class="btn-main btn-sec" data-no-reward="true">Continuar sem escolher</button>';
    openBase('Recompensa da Vitória', html);

    body().querySelectorAll('[data-reward-power]').forEach(function (button) {
      button.addEventListener('click', function () {
        CF.Loot.grantPowerUp(button.dataset.rewardPower);
        close();
      });
    });
    body().querySelector('[data-no-reward]').addEventListener('click', close);
  }

  function openNode(index) {
    const node = CF.State.getRun().nodes[index];
    if (!node) return;
    if (node.kind === 'battle' || node.kind === 'boss') openBattle(index);
    else if (node.kind === 'treasure') openTreasure(index);
    else if (node.kind === 'shop') openShop(index);
    else if (node.kind === 'camp') openCamp(index);
  }

  CF.Modal = {
    openNode: openNode,
    close: close,
    showFeedback: showFeedback,
    getCurrentNodeIndex: getCurrentNodeIndex,
    renderBossStep: renderBossStep,
    openRewardChoice: openRewardChoice
  };
}());
