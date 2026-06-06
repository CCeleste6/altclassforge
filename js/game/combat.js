(function () {
  window.CF = window.CF || {};

  const Utils = CF.Utils;
  let busy = false;

  function currentNode() {
    const run = CF.State.getRun();
    return run.nodes[CF.Modal.getCurrentNodeIndex()];
  }

  function currentStage() {
    const run = CF.State.getRun();
    const node = currentNode();
    return node ? run.stages[node.stageIndex] : null;
  }

  function recordAnswer(isCorrect) {
    CF.State.mutate(function (run) {
      run.stats.attempts += 1;
      if (isCorrect) {
        run.stats.correct += 1;
        run.stats.xp += 12;
      } else {
        run.stats.wrong += 1;
        run.stats.xp = Math.max(0, run.stats.xp - 2);
      }
    });
  }

  function takeDamage() {
    const damage = CF.Loot.getWrongDamage();
    let blocked = false;
    CF.State.mutate(function (run) {
      if (run.shield > 0) {
        run.shield -= 1;
        blocked = true;
        return;
      }
      run.hp = Math.max(0, run.hp - damage);
    });
    CF.Screens.syncHUD();

    if (blocked) return { damage: 0, blocked: true };
    if (CF.State.getRun().hp <= 0) {
      CF.State.resetRun();
      alert('💀 GAME OVER! A run foi perdida.');
      location.reload();
    }
    return { damage: damage, blocked: false };
  }

  function rewardAndAdvance() {
    const nodeIndex = CF.Modal.getCurrentNodeIndex();
    const run = CF.State.getRun();
    const node = run.nodes[nodeIndex];
    const reward = CF.Loot.getRewardValue(node);

    CF.State.mutate(function (state) {
      state.coins += reward;
      state.stats.coinsEarned += reward;
    });

    CF.Dungeon.completeNode(nodeIndex);
    CF.Audio.stopBossMusic();
    document.body.classList.remove('boss-mode');
    CF.Screens.syncHUD();
    CF.Map.render();

    if (CF.Dungeon.isRunComplete()) {
      CF.Modal.close();
      CF.Confetti.start();
      CF.State.resetRun();
      setTimeout(function () { alert('🏆 Vitória! Você completou a dungeon da matéria.'); }, 300);
      return;
    }

    CF.Modal.openRewardChoice(`Vitória! Você recebeu ${reward} moedas. Escolha uma melhoria para continuar.`);
  }

  function onCorrect(element) {
    if (busy) return;
    busy = true;
    recordAnswer(true);
    CF.Audio.playSound('win');
    element && element.classList.add('correct');

    const node = currentNode();
    if (node && node.kind === 'boss' && node.bossStep < 2) {
      CF.State.mutate(function (run) {
        run.nodes[CF.Modal.getCurrentNodeIndex()].bossStep += 1;
      });
      setTimeout(function () {
        busy = false;
        CF.Modal.renderBossStep();
      }, 850);
      return;
    }

    setTimeout(function () {
      busy = false;
      rewardAndAdvance();
    }, 850);
  }

  function onWrong(element) {
    if (busy) return;
    busy = true;
    recordAnswer(false);
    CF.Audio.playSound('error');
    element && element.classList.add('wrong');
    const result = takeDamage();
    const message = result.blocked ? '🛡️ Seu escudo bloqueou o erro!' : `ERRADO! (-${result.damage} HP)`;
    CF.Modal.showFeedback(message, false);
    setTimeout(function () {
      element && element.classList.remove('wrong');
      busy = false;
    }, 750);
  }

  function checkQuiz(selectedIndex, button) {
    const stage = currentStage();
    if (!stage) return;
    if (Number(selectedIndex) === Number(stage.quiz.correct)) onCorrect(button);
    else onWrong(button);
  }

  function checkMagic(answer, button) {
    const stage = currentStage();
    if (!stage) return;
    if (Boolean(answer) === Boolean(stage.magic.is_true)) onCorrect(button);
    else onWrong(button);
  }

  function checkStealth() {
    const input = document.getElementById('stealth-input');
    const button = document.getElementById('check-stealth-btn');
    const stage = currentStage();
    if (!input || !stage) return;

    const normalizedInput = Utils.normalizeText(input.value);
    const keywords = stage.stealth.keywords || [];
    const matches = keywords.filter(function (keyword) {
      return normalizedInput.includes(Utils.normalizeText(keyword));
    }).length;
    const required = CF.Loot.getStealthRequiredMatches(keywords.length);

    if (matches >= required) {
      CF.Modal.showFeedback(`Resposta aceita! (${matches}/${keywords.length} conceitos-chave)`, true);
      onCorrect(button);
    } else {
      CF.Modal.showFeedback(`Incompleto: ${matches}/${keywords.length} conceitos. Precisa de ${required}.`, false);
      setTimeout(function () {
        alert(`Resposta esperada: ${stage.stealth.answer}\n\nConceitos-chave: ${keywords.join(', ')}`);
      }, 250);
      onWrong(button);
    }
  }

  function useHint(hint, button) {
    const run = CF.State.getRun();
    if (run.vouchers <= 0) {
      CF.Audio.playSound('error');
      CF.Modal.showFeedback('Sem vouchers de dica.', false);
      return;
    }
    CF.State.mutate(function (state) {
      state.vouchers -= 1;
    });
    CF.Screens.syncHUD();
    button.disabled = true;
    button.textContent = 'Dica usada';
    alert(`💡 DICA: ${hint}`);
  }

  CF.Combat = {
    checkQuiz: checkQuiz,
    checkMagic: checkMagic,
    checkStealth: checkStealth,
    useHint: useHint,
    rewardAndAdvance: rewardAndAdvance
  };
}());
