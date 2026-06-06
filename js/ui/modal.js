(function () {
  window.CF = window.CF || {};

  const Utils = CF.Utils;
  const CONFIG = CF.CONFIG;
  let currentNodeIndex = -1;
  let quickTimer = null;

  function modal() { return document.getElementById('battle-modal'); }
  function title() { return document.getElementById('modal-title'); }
  function body() { return document.getElementById('modal-body'); }

  function getCurrentNodeIndex() {
    return currentNodeIndex;
  }

  function clearQuickTimer() {
    if (quickTimer) {
      clearInterval(quickTimer);
      quickTimer = null;
    }
  }

  function close() {
    clearQuickTimer();
    CF.Audio.stopBossMusic();
    document.body.classList.remove('boss-mode');
    modal().classList.remove('visible');
    CF.Combat.resetBusy && CF.Combat.resetBusy();
  }

  function openBase(label, html) {
    clearQuickTimer();
    title().textContent = label;
    body().innerHTML = html;
    modal().classList.add('visible');
  }

  function getStage(node) {
    return CF.State.getRun().stages[node.stageIndex];
  }

  function questionTypeConfig(type) {
    if (CF.Dungeon && CF.Dungeon.questionTypeConfig) return CF.Dungeon.questionTypeConfig(type);
    return (CONFIG.questionTypes && CONFIG.questionTypes[type]) || (CONFIG.questionTypes && CONFIG.questionTypes.standard) || { icon: '⚔️', label: 'Questão Padrão', short: 'Padrão' };
  }

  function getQuestionLabel(type) {
    const config = questionTypeConfig(type);
    return `${config.icon} ${config.label}`;
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

  function loreHTML(node, type) {
    const typeConfig = questionTypeConfig(type);
    return `
      <div class="question-meta">
        <span>${typeConfig.icon} ${Utils.escapeHTML(typeConfig.label)}</span>
        <span>Casa ${node.floor}</span>
      </div>
      <div class="lore-box">${Utils.escapeHTML(node.desc || 'Desafio...')}</div>
    `;
  }

  function hintButton(hint) {
    return `<button class="hint-btn" data-hint="${Utils.escapeHTML(hint || 'Sem dica disponível.')}">💡 DICA</button>`;
  }

  function bindHint() {
    const hint = body().querySelector('[data-hint]');
    if (!hint) return;
    hint.addEventListener('click', function () {
      CF.Combat.useHint(hint.dataset.hint, hint);
    });
  }

  function renderChoiceButtons(stage, type, node) {
    const visible = CF.Loot.getVisibleOptions(stage, type, node);
    let html = '<div class="choice-list">';
    visible.forEach(function (option, visibleIndex) {
      html += `<button class="quiz-btn" data-choice-index="${option.originalIndex}"><strong>${Utils.letter(visibleIndex)})</strong> ${Utils.escapeHTML(option.text)}</button>`;
    });
    html += '</div>';
    return html;
  }

  function bindChoiceButtons() {
    body().querySelectorAll('[data-choice-index]').forEach(function (button) {
      button.addEventListener('click', function () {
        CF.Combat.checkChoice(button.dataset.choiceIndex, button);
      });
    });
  }

  function renderStandard(node, stage) {
    openBase(getQuestionLabel('standard'), `
      ${loreHTML(node, 'standard')}
      <p class="question-text">${Utils.escapeHTML(stage.standard.question)}</p>
      ${renderChoiceButtons(stage, 'standard', node)}
      ${feedbackHTML()}
      ${hintButton(stage.standard.hint)}
    `);
    bindChoiceButtons();
    bindHint();
  }

  function renderMultiple(node, stage) {
    let html = `
      ${loreHTML(node, 'multiple')}
      <p class="question-text">${Utils.escapeHTML(stage.multiple.question)}</p>
      <div class="statement-list">
    `;
    stage.multiple.statements.forEach(function (statement, index) {
      html += `
        <div class="statement-row" data-statement-index="${index}">
          <p>${Utils.escapeHTML(statement.text)}</p>
          <label><input type="radio" name="statement-${index}" value="true"> Verdadeiro</label>
          <label><input type="radio" name="statement-${index}" value="false"> Falso</label>
        </div>
      `;
    });
    html += `
      </div>
      <button class="btn-main" id="check-multiple-btn">Confirmar V/F</button>
      ${feedbackHTML()}
      ${hintButton(stage.multiple.hint)}
    `;
    openBase(getQuestionLabel('multiple'), html);
    document.getElementById('check-multiple-btn').addEventListener('click', function (event) {
      CF.Combat.checkMultiple(event.currentTarget);
    });
    bindHint();
  }

  function renderScientific(node, stage) {
    const hasSift = CF.State.hasPower('sift');
    const vital = stage.scientific.vitalInfo || [];
    const vitalHTML = vital.length ? `
      <div class="vital-box ${hasSift ? 'separated' : ''}">
        <strong>${hasSift ? 'Informações vitais cernidas:' : 'Informações vitais no enunciado:'}</strong>
        <ul>${vital.map(function (item) { return `<li>${Utils.escapeHTML(item)}</li>`; }).join('')}</ul>
      </div>
    ` : '';

    openBase(getQuestionLabel('scientific'), `
      ${loreHTML(node, 'scientific')}
      <div class="scientific-context">
        <strong>Enunciado:</strong>
        <p>${Utils.escapeHTML(stage.scientific.context)}</p>
        ${hasSift ? '' : vitalHTML}
      </div>
      <p class="question-text">${Utils.escapeHTML(stage.scientific.question)}</p>
      ${renderChoiceButtons(stage, 'scientific', node)}
      ${hasSift ? vitalHTML : ''}
      ${feedbackHTML()}
      ${hintButton(stage.scientific.hint)}
    `);
    bindChoiceButtons();
    bindHint();
  }

  function startQuickTimer(totalSeconds) {
    const timerText = document.getElementById('quick-timer-text');
    const timerFill = document.getElementById('quick-timer-fill');
    let remaining = Number(totalSeconds || CONFIG.quickBaseSeconds);
    timerText.textContent = `${remaining}s`;
    timerFill.style.width = '100%';
    quickTimer = setInterval(function () {
      remaining -= 1;
      timerText.textContent = `${Math.max(remaining, 0)}s`;
      timerFill.style.width = `${Math.max(0, (remaining / totalSeconds) * 100)}%`;
      if (remaining <= 0) {
        clearQuickTimer();
        CF.Combat.timeoutQuick();
      }
    }, 1000);
  }

  function renderQuick(node, stage) {
    const seconds = CF.Loot.getQuickSeconds(stage);
    CF.State.mutate(function (run) {
      const activeNode = run.nodes[currentNodeIndex];
      if (activeNode) activeNode.startedAt = Date.now();
    });
    openBase(getQuestionLabel('quick'), `
      ${loreHTML(node, 'quick')}
      <div class="quick-timer">
        <span>Tempo restante: <strong id="quick-timer-text">${seconds}s</strong></span>
        <div class="timer-track"><div id="quick-timer-fill" class="timer-fill"></div></div>
      </div>
      <p class="question-text">${Utils.escapeHTML(stage.quick.question)}</p>
      ${renderChoiceButtons(stage, 'quick', node)}
      <span id="quick-timeout-anchor" class="hidden"></span>
      ${feedbackHTML()}
      ${hintButton(stage.quick.hint)}
    `);
    bindChoiceButtons();
    bindHint();
    startQuickTimer(seconds);
  }

  function renderQuestion(type) {
    const run = CF.State.getRun();
    const node = run.nodes[currentNodeIndex];
    const stage = getStage(node);
    if (!node || !stage) return;
    if (type === 'multiple') renderMultiple(node, stage);
    else if (type === 'scientific') renderScientific(node, stage);
    else if (type === 'quick') renderQuick(node, stage);
    else renderStandard(node, stage);
  }

  function renderBossStep() {
    const run = CF.State.getRun();
    const node = run.nodes[currentNodeIndex];
    if (!node) return;
    const steps = node.bossSteps || ['standard', 'multiple', 'scientific', 'quick'];
    const step = steps[node.bossStep || 0];
    document.body.classList.add('boss-mode');
    renderQuestion(step);
    title().textContent = `${node.title} · Fase ${(node.bossStep || 0) + 1}/${steps.length}`;
  }

  function openBattle(index) {
    currentNodeIndex = index;
    const node = CF.State.getRun().nodes[index];
    if (!node) return;
    if (node.kind === 'boss') {
      CF.Audio.playSound('boss');
      CF.Audio.playBossMusic();
      renderBossStep();
      return;
    }
    renderQuestion(node.questionType || 'standard');
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
    const shopCandidates = CF.Loot.randomChoices(3).map(function (power, itemIndex) {
      return Object.assign({}, power, { cost: 12 + itemIndex * 6 });
    });
    shopCandidates.unshift(Object.assign({}, CF.Loot.getPowerUp('heal'), { cost: 10 }));
    shopCandidates.push(Object.assign({}, CF.Loot.getPowerUp('shield'), { cost: 14 }));

    let html = `<div class="lore-box">O mercador aceita moedas de troca da run. Você tem <strong>${CF.State.getRun().coins}</strong> moedas.</div>`;
    shopCandidates.forEach(function (item) {
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
        CF.Map.render();
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
    openRewardChoice: openRewardChoice,
    clearQuickTimer: clearQuickTimer
  };
}());
