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

  function currentQuestionType() {
    const node = currentNode();
    if (!node) return 'standard';
    if (node.kind === 'boss') return node.bossSteps[node.bossStep || 0] || 'standard';
    return node.questionType || 'standard';
  }

  function recordAnswer(isCorrect, type) {
    CF.State.mutate(function (run) {
      run.stats.attempts += 1;
      if (!run.stats.byType[type]) run.stats.byType[type] = { attempts: 0, correct: 0 };
      run.stats.byType[type].attempts += 1;
      if (isCorrect) {
        run.stats.correct += 1;
        run.stats.byType[type].correct += 1;
        run.stats.xp += type === 'quick' ? 10 : type === 'scientific' ? 16 : 12;
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
      const node = currentNode();
      if (node) node.mistakes = Number(node.mistakes || 0) + 1;
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

  function elapsedSeconds(node) {
    if (!node || !node.startedAt) return 999;
    return Math.floor((Date.now() - node.startedAt) / 1000);
  }

  function rewardAndAdvance(effectMessage) {
    const nodeIndex = CF.Modal.getCurrentNodeIndex();
    const run = CF.State.getRun();
    const node = run.nodes[nodeIndex];
    const reward = CF.Loot.getRewardValue(node);

    CF.State.mutate(function (state) {
      state.coins += reward;
      state.stats.coinsEarned += reward;
    });

    const completeMessage = CF.Dungeon.completeNode(nodeIndex);
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

    const finalMessage = [`Vitória! Você recebeu ${reward} moedas.`, effectMessage, completeMessage].filter(Boolean).join(' ');
    CF.Modal.openRewardChoice(`${finalMessage} Escolha uma melhoria para continuar.`);
  }

  function onCorrect(element) {
    if (busy) return;
    busy = true;
    const node = currentNode();
    const type = currentQuestionType();
    const elapsed = elapsedSeconds(node);
    recordAnswer(true, type);
    CF.Audio.playSound('win');
    element && element.classList.add('correct');

    const effectMessage = CF.Loot.resolveTypeEffects(node, elapsed);

    if (node && node.kind === 'boss' && node.bossStep < node.bossSteps.length - 1) {
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
      rewardAndAdvance(effectMessage);
    }, 850);
  }

  function onWrong(element, customMessage) {
    if (busy) return;
    busy = true;
    const type = currentQuestionType();
    recordAnswer(false, type);
    CF.Audio.playSound('error');
    element && element.classList.add('wrong');
    const result = takeDamage();
    const message = customMessage || (result.blocked ? '🛡️ Seu escudo bloqueou o erro!' : `ERRADO! (-${result.damage} HP)`);
    CF.Modal.showFeedback(message, false);
    setTimeout(function () {
      element && element.classList.remove('wrong');
      busy = false;
    }, 750);
  }

  function checkChoice(selectedOriginalIndex, button) {
    const stage = currentStage();
    const type = currentQuestionType();
    if (!stage) return;
    if (type === 'quick' && CF.Modal.clearQuickTimer) CF.Modal.clearQuickTimer();
    const source = type === 'scientific' ? stage.scientific : type === 'quick' ? stage.quick : stage.standard;
    if (Number(selectedOriginalIndex) === Number(source.correct)) onCorrect(button);
    else onWrong(button);
  }

  function checkMultiple(button) {
    const stage = currentStage();
    if (!stage) return;
    const rows = Array.from(document.querySelectorAll('[data-statement-index]'));
    const missing = rows.some(function (row) { return !row.querySelector('input:checked'); });
    if (missing) {
      CF.Modal.showFeedback('Marque V ou F em todas as afirmações.', false);
      return;
    }

    const allCorrect = rows.every(function (row) {
      const index = Number(row.dataset.statementIndex);
      const selected = row.querySelector('input:checked').value === 'true';
      return selected === Boolean(stage.multiple.statements[index].is_true);
    });

    if (allCorrect) onCorrect(button);
    else onWrong(button);
  }

  function timeoutQuick() {
    const button = document.getElementById('quick-timeout-anchor');
    onWrong(button, `⏰ Tempo esgotado! (-${CF.Loot.getWrongDamage()} HP)`);
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

  function resetBusy() {
    busy = false;
  }

  CF.Combat = {
    checkChoice: checkChoice,
    checkMultiple: checkMultiple,
    timeoutQuick: timeoutQuick,
    useHint: useHint,
    rewardAndAdvance: rewardAndAdvance,
    resetBusy: resetBusy
  };
}());
